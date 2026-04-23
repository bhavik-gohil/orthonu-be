const { Coupon, CouponUse } = require('../models');

// GET all coupons — admin only
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        res.json(coupons);
    } catch (err) {
        console.error('getCoupons error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET advertised coupons — public (for checkout page)
const getAdvertisedCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({
            where: { advertiseToUser: true, isActive: true },
            order: [['createdAt', 'DESC']],
        });
        res.json(coupons);
    } catch (err) {
        console.error('getAdvertisedCoupons error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST create coupon — admin only
const createCoupon = async (req, res) => {
    try {
        const {
            discountPercentage,
            maxDiscountAmount,
            useCountPerUser,
            advertiseToUser,
            discountName,
            header,
            subHeader,
        } = req.body;

        if (!discountPercentage || !discountName || !header) {
            return res.status(400).json({ error: 'discountPercentage, discountName, and header are required' });
        }

        // Check if discountName already exists
        const existing = await Coupon.findOne({ where: { discountName } });
        if (existing) {
            return res.status(409).json({ error: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            discountPercentage,
            maxDiscountAmount: maxDiscountAmount || null,
            useCountPerUser: useCountPerUser || 1,
            advertiseToUser: advertiseToUser !== undefined ? advertiseToUser : true,
            discountName,
            header,
            subHeader: subHeader || null,
            isActive: true,
        });

        res.status(201).json(coupon);
    } catch (err) {
        console.error('createCoupon error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// PATCH update coupon — admin only
const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByPk(id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        const {
            discountPercentage,
            maxDiscountAmount,
            useCountPerUser,
            advertiseToUser,
            header,
            subHeader,
            isActive,
        } = req.body;

        const updates = {};
        if (discountPercentage !== undefined) updates.discountPercentage = discountPercentage;
        if (maxDiscountAmount !== undefined) updates.maxDiscountAmount = maxDiscountAmount;
        if (useCountPerUser !== undefined) updates.useCountPerUser = useCountPerUser;
        if (advertiseToUser !== undefined) updates.advertiseToUser = advertiseToUser;
        if (header !== undefined) updates.header = header;
        if (subHeader !== undefined) updates.subHeader = subHeader;
        if (isActive !== undefined) updates.isActive = isActive;

        await coupon.update(updates);
        res.json(coupon);
    } catch (err) {
        console.error('updateCoupon error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST validate coupon — public (for checkout)
const validateCoupon = async (req, res) => {
    try {
        const { discountName, userId } = req.body;

        if (!discountName) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ where: { discountName } });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ error: 'This coupon is no longer active' });
        }

        // Check usage count if userId provided
        if (userId) {
            const useCount = await CouponUse.count({
                where: { couponId: coupon.id, userId },
            });

            if (useCount >= coupon.useCountPerUser) {
                return res.status(400).json({ error: 'You have already used this coupon the maximum number of times' });
            }
        }

        res.json({
            valid: true,
            coupon: {
                id: coupon.id,
                discountName: coupon.discountName,
                discountPercentage: coupon.discountPercentage,
                maxDiscountAmount: coupon.maxDiscountAmount,
                header: coupon.header,
                subHeader: coupon.subHeader,
            },
        });
    } catch (err) {
        console.error('validateCoupon error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getCoupons,
    getAdvertisedCoupons,
    createCoupon,
    updateCoupon,
    validateCoupon,
};
