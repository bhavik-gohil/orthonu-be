const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { login, me, logout, createUser, resetPassword, getUsers, getAllUsers, updateUserStatus, extendSession } = require('../controllers/adminAuthController');

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/logout', logout);
router.post('/refresh-session', extendSession); // No authMiddleware here as the token might be expired
router.get('/users', authMiddleware, getUsers);
router.post('/user/create', authMiddleware, createUser);
router.post('/reset-password', authMiddleware, resetPassword);

// User management routes
router.get('/all-users', authMiddleware, getAllUsers);
router.patch('/users/:userId/status', authMiddleware, updateUserStatus);

module.exports = router;
