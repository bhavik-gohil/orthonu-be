const express = require('express');
const router = express.Router();
const { getTestimonials, createTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrEditor } = require('../middleware/roleMiddleware');

// Public
router.get('/', getTestimonials);

// Admin only
router.post('/', authMiddleware, adminOrEditor, createTestimonial);
router.delete('/:id', authMiddleware, adminOrEditor, deleteTestimonial);

module.exports = router;
