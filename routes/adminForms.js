const express = require('express');
const router = express.Router();
const { getAllForms, getFormById } = require('../controllers/formController');
const authMiddleware = require('../middleware/authMiddleware');
const { mainAdminOnly } = require('../middleware/roleMiddleware');

// All routes in this file require main_admin authentication
router.use(authMiddleware);
router.use(mainAdminOnly);

/**
 * @route GET /admin/submissions
 * @desc Get all form submissions (paginated)
 * @access Private (Main Admin)
 */
router.get('/', getAllForms);

/**
 * @route GET /admin/submissions/:id
 * @desc Get single form submission details
 * @access Private (Main Admin)
 */
router.get('/:id', getFormById);

module.exports = router;
