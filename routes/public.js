const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/product/getProducts');
const { getProduct } = require('../controllers/product/getProduct');
const { getProductCategory } = require('../controllers/productCategory/productCategory');

// Get all variants for a specific variantId (public endpoint)
const getVariants = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { Product, ProductPrice, ProductMedia } = require('../models');
        
        const variants = await Product.findAll({
            where: { variantId: parseInt(variantId) },
            include: [
                { model: ProductPrice, as: 'prices' },
                { model: ProductMedia, as: 'media' },
            ],
            order: [
                [{ model: ProductMedia, as: 'media' }, 'displayOrder', 'ASC']
            ],
        });

        res.status(200).json(variants);
    } catch (err) {
        console.error('Error fetching variants:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

// Publicly accessible routes
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/variants/:variantId', getVariants);
router.get('/categories', getProductCategory);

module.exports = router;
