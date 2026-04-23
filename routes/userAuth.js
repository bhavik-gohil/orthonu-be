const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);
router.post('/logout', userAuthController.logout);
router.get('/me', authMiddleware, userAuthController.me);
router.patch('/update-profile', authMiddleware, userAuthController.updateProfile);
router.post('/delete-account', authMiddleware, userAuthController.deleteAccount);

module.exports = router;
