const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { User, Sequelize } = require("../models");
const { USER_TYPES, USER_STATUS } = require("../utils/constants");
const { generateOtp } = require("./otpController");

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
  if (existing) {
    if (existing.isVerified) {
      return res.status(409).json({ message: "Email is already in use." });
    } else {
      // Automatic Verification Prompt flow for unverified existing users
      try {
        await generateOtp(existing.email, 'registration');
        return res.status(200).json({ 
          status: "PENDING_VERIFICATION", 
          message: "This email is already registered but not verified. A new verification code has been sent to your inbox.",
          email: existing.email
        });
      } catch (err) {
        console.error("Failed to resend OTP during registration:", err);
        return res.status(500).json({ message: "Internal server error." });
      }
    }
  }

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

    // Trigger OTP instead of immediate login
    try {
      await generateOtp(newUser.email, 'registration');
      return res.status(201).json({
        status: "PENDING_VERIFICATION",
        message: "Registration successful. Please verify your email with the code sent to your inbox.",
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
      console.error("Failed to send OTP after registration:", err);
      // Even if email fails, user is created, they can try to resend later
      return res.status(201).json({
        status: "PENDING_VERIFICATION",
        message: "Registration successful, but we failed to send the verification email. Please click resend code.",
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

  if (!user.isVerified) {
    try {
      await generateOtp(user.email, 'registration');
      return res.status(200).json({ 
        status: "NOT_VERIFIED", 
        message: "Your email is not verified. A new verification code has been sent to your inbox.",
        email: user.email 
      });
    } catch (err) {
      console.error("Failed to send OTP during login:", err);
      return res.status(200).json({ 
        status: "NOT_VERIFIED", 
        message: "Your email is not verified. Failed to send new code, please try to resend manually.",
        email: user.email 
      });
    }
  }

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

// ─── forgotPassword ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return 200 even if user not found for security, but we can return error in internal test apps
      // For this app, we'll return 404 to be clear for the user.
      return res.status(404).json({ message: "No account found with this email." });
    }

    await generateOtp(email, 'password_reset');
    return res.status(200).json({ message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── resetPassword ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: "Invalid token purpose." });
    }

    const user = await User.findOne({ where: { email: decoded.email } });
    if (!user) return res.status(404).json({ message: "User not found." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    }
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }
};

module.exports = { register, login, me, logout, updateProfile, deleteAccount, forgotPassword, resetPassword };
