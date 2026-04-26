const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const authMiddleware = require('../middleware/authMiddleware');

const otpController = require('../controllers/otpController');

router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);
router.post('/logout', userAuthController.logout);
router.get('/me', authMiddleware, userAuthController.me);
router.patch('/update-profile', authMiddleware, userAuthController.updateProfile);
router.post('/delete-account', authMiddleware, userAuthController.deleteAccount);
router.post('/forgot-password', userAuthController.forgotPassword);
router.post('/reset-password', userAuthController.resetPassword);

// OTP Routes
router.post('/verify-otp', otpController.verifyOtp);
router.post('/resend-otp', otpController.resendOtp);

module.exports = router;
