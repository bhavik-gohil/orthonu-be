const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  submitPartnershipForm,
  submitWhitePaperForm,
  getAllForms,
  getFormById
} = require('../controllers/formController');
const authMiddleware = require('../middleware/authMiddleware');
const { mainAdminOnly } = require('../middleware/roleMiddleware');

// Public form submission endpoints
router.post('/contact', submitContactForm);
router.post('/partnership', submitPartnershipForm);
router.post('/white-paper', submitWhitePaperForm);

// Admin-only endpoints for viewing form submissions
router.get('/', authMiddleware, mainAdminOnly, getAllForms);
router.get('/:id', authMiddleware, mainAdminOnly, getFormById);

module.exports = router;