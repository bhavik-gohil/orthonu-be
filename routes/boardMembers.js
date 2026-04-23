const express = require('express');
const router = express.Router();
const { getBoardMembers, createBoardMember, deleteBoardMember } = require('../controllers/boardMemberController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrEditor } = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');

// Public
router.get('/', getBoardMembers);

// Admin only
router.post('/', authMiddleware, adminOrEditor, upload.single('image'), createBoardMember);
router.delete('/:id', authMiddleware, adminOrEditor, deleteBoardMember);

module.exports = router;
