const { Otp, User, AdminUser } = require('../models');
const { sendOtpEmail } = require('../utils/email');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const generateOtp = async (email, type) => {
    // Expire any existing unused OTPs for this email/type
    await Otp.update({ isUsed: true }, { 
        where: { email, type, isUsed: false } 
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = await Otp.create({
        email,
        code,
        type,
        expiresAt,
        isUsed: false
    });

    // Send email
    await sendOtpEmail(email, code, type);

    return otp;
};

const verifyOtp = async (req, res) => {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
        return res.status(400).json({ message: "Email, code, and type are required." });
    }

    try {
        const otp = await Otp.findOne({
            where: { email, code, type, isUsed: false }
        });

        if (!otp) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        if (new Date() > otp.expiresAt) {
            return res.status(400).json({ message: "Verification code has expired." });
        }

        // Mark as used
        otp.isUsed = true;
        await otp.save();

        if (type === 'registration') {
            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(404).json({ message: "User not found." });

            user.isVerified = true;
            if (user.userType === 'regular') {
                user.status = 'active';
            }
            await user.save();

            // Sign token and log them in
            const token = jwt.sign(
                {
                    id: user.id,
                    uid: user.uid,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    status: user.status,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.cookie("user_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                message: "Email verified successfully.",
                user: {
                    id: user.id,
                    uid: user.uid,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    status: user.status,
                }
            });
        }

        if (type === 'password_reset') {
            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(404).json({ message: "User not found." });

            const resetToken = jwt.sign(
                { email: user.email, purpose: 'password_reset' },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            return res.status(200).json({
                message: "OTP verified. You can now reset your password.",
                resetToken
            });
        }

        if (type === 'admin_login') {
            const admin = await AdminUser.findOne({ where: { email } });
            if (!admin) return res.status(404).json({ message: "Admin not found." });

            // Create admin session
            const sessionToken = crypto.randomUUID();
            const { UserSession } = require('../models');
            await UserSession.destroy({ where: { userId: admin.uid, isAdmin: true } });
            await UserSession.create({
                userId: admin.uid,
                isAdmin: true,
                sessionToken
            });

            const token = jwt.sign(
                {
                    id: admin.id,
                    uid: admin.uid,
                    name: admin.name,
                    email: admin.email,
                    userType: admin.userType,
                    status: admin.status,
                    sessionToken,
                },
                process.env.JWT_SECRET,
                { expiresIn: "30m" }
            );

            res.cookie("admin_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 30 * 60 * 1000,
            });

            return res.status(200).json({
                message: "OTP verified successfully.",
                adminUser: {
                    id: admin.id,
                    uid: admin.uid,
                    name: admin.name,
                    email: admin.email,
                    userType: admin.userType,
                    status: admin.status,
                }
            });
        }

        return res.status(400).json({ message: "Invalid OTP type." });

    } catch (err) {
        console.error("OTP verification error:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const resendOtp = async (req, res) => {
    const { email, type } = req.body;
    if (!email || !type) {
        return res.status(400).json({ message: "Email and type are required." });
    }

    try {
        await generateOtp(email, type);
        return res.status(200).json({ message: "Verification code resent." });
    } catch (err) {
        console.error("Resend OTP error:", err);
        return res.status(500).json({ message: "Failed to resend verification code." });
    }
};

module.exports = { generateOtp, verifyOtp, resendOtp };
