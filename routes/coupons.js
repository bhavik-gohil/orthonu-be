const express = require('express');
const router = express.Router();
const {
    getCoupons,
    getAdvertisedCoupons,
    createCoupon,
    updateCoupon,
    validateCoupon,
} = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');
const { mainAdminOnly } = require('../middleware/roleMiddleware');

// Public
router.get('/advertised', getAdvertisedCoupons);
router.post('/validate', validateCoupon);

// Admin only
router.get('/', authMiddleware, mainAdminOnly, getCoupons);
router.post('/', authMiddleware, mainAdminOnly, createCoupon);
router.patch('/:id', authMiddleware, mainAdminOnly, updateCoupon);

module.exports = router;
