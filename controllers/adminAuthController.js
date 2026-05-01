const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Joi = require("joi");
const { AdminUser, User, UserSession, Sequelize } = require("../models");
const { Op } = Sequelize;
const {
  ADMIN_USER_TYPES,
  ADMIN_USER_STATUS,
  USER_STATUS,
} = require("../utils/constants");
const { generateOtp } = require("./otpController");

// ─── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  userType: Joi.string()
    .valid(ADMIN_USER_TYPES.EDITOR, ADMIN_USER_TYPES.ORDER_MANAGER)
    .required(),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(user, sessionToken) {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      userType: user.userType,
      status: user.status,
      sessionToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }, // 30 minutes session timeout
  );
}

// ─── login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await AdminUser.findOne({ where: { email: value.email } });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password." });

  const match = await bcrypt.compare(value.password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid email or password." });

  if (user.status === "inactive")
    return res.status(403).json({ message: "Account is inactive." });

  // --- 2FA OTP Flow ---
  try {
    await generateOtp(user.email, "admin_login");
    return res.status(200).json({
      requireOtp: true,
      message:
        "Credentials verified. Please enter the verification code sent to your email.",
      email: user.email,
    });
  } catch (err) {
    console.error("Failed to send Admin 2FA OTP:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── me ───────────────────────────────────────────────────────────────────────
const me = async (req, res) => {
  // req.adminUser is populated by authMiddleware
  return res.status(200).json(req.adminUser);
};

// ─── createUser ───────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  if (req.adminUser.userType !== ADMIN_USER_TYPES.MAIN_ADMIN) {
    return res
      .status(403)
      .json({ message: "Only the main admin can create users." });
  }

  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const existing = await AdminUser.findOne({ where: { email: value.email } });
  if (existing)
    return res.status(409).json({ message: "Email is already in use." });

  const hashedPassword = await bcrypt.hash(value.password, 10);
  const newUser = await AdminUser.create({
    name: value.name,
    email: value.email,
    password: hashedPassword,
    userType: value.userType,
    status: ADMIN_USER_STATUS.PASSWORD_RESET_PENDING,
  });

  return res.status(201).json({
    id: newUser.id,
    uid: newUser.uid,
    name: newUser.name,
    email: newUser.email,
    userType: newUser.userType,
    status: newUser.status,
  });
};

// ─── resetPassword ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await AdminUser.findByPk(req.adminUser.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  const hashedPassword = await bcrypt.hash(value.newPassword, 10);
  await user.update({ password: hashedPassword, status: "active" });

  // Create a fresh session for the user after password reset
  const sessionToken = crypto.randomUUID();
  await UserSession.destroy({ where: { userId: user.uid, isAdmin: true } });
  await UserSession.create({ userId: user.uid, isAdmin: true, sessionToken });

  const token = signToken(
    { ...user.dataValues, status: "active" },
    sessionToken,
  );

  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60 * 1000,
  });

  return res
    .status(200)
    .json({ message: "Password updated successfully.", token });
};

// ─── getUsers ─────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  if (req.adminUser.userType !== ADMIN_USER_TYPES.MAIN_ADMIN) {
    return res.status(403).json({ message: "Not allowed" });
  }
  const users = await AdminUser.findAll({
    attributes: { exclude: ["password"] },
    order: [["createdAt", "DESC"]],
    where: {
      userType: {
        [Op.ne]: ADMIN_USER_TYPES.MAIN_ADMIN,
      },
    },
  });
  return res.status(200).json(users);
};

const logout = async (req, res) => {
  // Decode the token (even if expired) to get the user ID for DB cleanup
  const token = req.cookies.admin_token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: true,
      });
      if (payload.uid) {
        await UserSession.destroy({
          where: { userId: payload.uid, isAdmin: true },
        });
      }
    } catch (err) {
      console.error("Failed to clear admin session on logout:", err);
    }
  }
  res.clearCookie("admin_token");
  return res.status(200).json({ message: "Logged out successfully." });
};

// ─── getAllUsers ──────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  if (req.adminUser.userType !== ADMIN_USER_TYPES.MAIN_ADMIN) {
    return res.status(403).json({ message: "Not allowed" });
  }

  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── updateUserStatus ─────────────────────────────────────────────────────────
const updateUserStatus = async (req, res) => {
  if (req.adminUser.userType !== ADMIN_USER_TYPES.MAIN_ADMIN) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const { userId } = req.params;
  const { status } = req.body;

  if (!Object.values(USER_STATUS).includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ status });
    return res
      .status(200)
      .json({ message: "User status updated successfully" });
  } catch (err) {
    console.error("Update user status error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const extendSession = async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: "No session found." });

  try {
    // Decode without verification of expiration to get user info
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: true,
    });

    // Verify session still exists in DB
    const sessionRecord = await UserSession.findOne({
      where: { userId: payload.uid, isAdmin: true },
    });

    if (!sessionRecord || sessionRecord.sessionToken !== payload.sessionToken) {
      return res.status(401).json({ message: "Session invalid or expired." });
    }

    // Check if the DB session is too old (e.g., 30 minutes of total inactivity)
    const tooOldSession = new Date(Date.now() - 30 * 60 * 1000);
    if (sessionRecord.updatedAt < tooOldSession) {
      await sessionRecord.destroy();
      return res
        .status(401)
        .json({ message: "Session timed out due to inactivity." });
    }

    // Issue new token
    const user = await AdminUser.findOne({ where: { uid: payload.uid } });
    if (!user || user.status === "inactive") {
      return res
        .status(401)
        .json({ message: "User account no longer active." });
    }

    const newToken = signToken(user, sessionRecord.sessionToken);

    // Refresh cookie
    res.cookie("admin_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // Update DB timestamp to slide the 4-hour window
    await sessionRecord.changed("updatedAt", true);
    await sessionRecord.save();

    return res.status(200).json({
      message: "Session extended successfully.",
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        userType: user.userType,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Extend session error:", err);
    return res.status(401).json({ message: "Failed to extend session." });
  }
};

module.exports = {
  login,
  me,
  logout,
  createUser,
  resetPassword,
  getUsers,
  getAllUsers,
  updateUserStatus,
  extendSession,
};
