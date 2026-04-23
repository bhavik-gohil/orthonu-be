const express = require('express');
const router = express.Router();
const { getPartners, createPartner, deletePartner } = require('../controllers/partnerController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrEditor } = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');

// Public
router.get('/', getPartners);

// Admin only
router.post('/', authMiddleware, adminOrEditor, upload.single('logo'), createPartner);
router.delete('/:id', authMiddleware, adminOrEditor, deletePartner);

module.exports = router;
