const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { User, Sequelize } = require("../models");
const { USER_TYPES, USER_STATUS } = require("../utils/constants");

// ─── Schemas ──────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  userType: Joi.string()
    .valid(USER_TYPES.REGULAR, USER_TYPES.PROFESSIONAL)
    .required(),
  // Professional fields (conditional)
  profession: Joi.string().allow(null, ""),
  npiNumber: Joi.string().allow(null, ""),
  emailProfessional: Joi.string().email().allow(null, ""),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      userType: user.userType,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// ─── register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const existing = await User.findOne({ where: { email: value.email } });
  if (existing)
    return res.status(409).json({ message: "Email is already in use." });

  if (value.emailProfessional) {
    const existingProf = await User.findOne({
      where: { emailProfessional: value.emailProfessional },
    });
    if (existingProf)
      return res
        .status(409)
        .json({ message: "Professional email is already in use." });
  }

  const hashedPassword = await bcrypt.hash(value.password, 10);

  const userData = {
    name: value.name,
    email: value.email,
    password: hashedPassword,
    userType: value.userType,
    status: value.userType === USER_TYPES.PROFESSIONAL ? "pending" : "active",
    isProfessionalUser: value.userType === USER_TYPES.PROFESSIONAL,
  };

  if (value.userType === USER_TYPES.PROFESSIONAL) {
    userData.profession = value.profession;
    userData.npiNumber = value.npiNumber;
    userData.emailProfessional = value.emailProfessional;
  }

  try {
    const newUser = await User.create(userData);

    // For regular users, log them in immediately
    if (newUser.status === "active") {
      const token = signToken(newUser);
      res.cookie("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        user: {
          id: newUser.id,
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          userType: newUser.userType,
          status: newUser.status,
        },
      });
    }

    return res.status(201).json({
      message:
        "Registration successful. Professional accounts are subject to review.",
      user: {
        id: newUser.id,
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findOne({ where: { email: value.email } });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password." });

  const match = await bcrypt.compare(value.password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid email or password." });

  if (user.status === "inactive")
    return res.status(403).json({ message: "Account is inactive." });

  if (user.status === "pending")
    return res.status(403).json({ message: "Your account is pending approval. Please wait for an administrator to review your application." });

  if (user.status === "not-approved")
    return res.status(403).json({ message: "Your account application was not approved. Please contact support." });

  if (user.status !== "active")
    return res.status(403).json({ message: "Account is not active." });

  const token = signToken(user);

  res.cookie("user_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      userType: user.userType,
      status: user.status,
    },
  });
};

// ─── me ───────────────────────────────────────────────────────────────────────
const me = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// ─── logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.clearCookie("user_token");
  return res.status(200).json({ message: "Logged out successfully." });
};

// ... (schemas and other functions)

// ─── updateProfile ────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const allowedFields = [
    "name",
    "fullName",
    "phone",
    "streetAddress1",
    "streetAddress2",
    "city",
    "state",
    "country",
    "zipcode",
    "isBillingSameAsShipping",
    "billingNameOnCard",
    "billingStreetAddress1",
    "billingStreetAddress2",
    "billingCity",
    "billingState",
    "billingCountry",
    "billingZipcode",
  ];

  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  try {
    await User.update(updates, { where: { id: req.user.id } });
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── deleteAccount ────────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { password } = req.body;
  if (!password)
    return res.status(400).json({ message: "Password is required." });

  try {
    const user = await User.findByPk(req.user.id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password." });

    user.status = USER_STATUS.DELETED;
    await user.save();

    res.clearCookie("user_token");
    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { register, login, me, logout, updateProfile, deleteAccount };
