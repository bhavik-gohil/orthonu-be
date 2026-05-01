const { Product, ProductPrice, ProductBundle, ProductMedia, ProductCategory } = require('../../models');
const { Op } = require('sequelize');

const getProducts = async (req, res) => {
    try {
        // Check if this is an admin request (has auth middleware)
        const isAdmin = req.adminUser && req.adminUser.userType === 'main_admin';
        
        let whereClause = {};
        if (!isAdmin) {
            // Public sees only default variants and non-variant products
            whereClause = {
                [Op.or]: [
                    { variantId: null }, // original non-variant products
                    { isDefaultVariant: true } // default variants to show in listings
                ]
            };
        }

        // --- OPTIMIZATION: SINGLE PRODUCT FETCH (BY UID or ID) ---
        if (req.query.uid || req.query.id) {
            // 1. Fetch the core product with all associations in ONE go
            const result = await Product.findOne({
                where: req.query.uid ? { uid: req.query.uid } : { id: req.query.id },
                include: [
                    { model: ProductPrice, as: 'prices', attributes: { exclude: ['createdAt', 'updatedAt'] } },
                    { 
                        model: ProductBundle, as: 'bundleItems',
                        include: [{ 
                            model: Product, as: 'product',
                            include: [{ model: ProductMedia, as: 'media' }] 
                        }]
                    },
                    { model: ProductMedia, as: 'media', order: [['displayOrder', 'ASC']] },
                    { model: ProductCategory, as: 'categories', through: { attributes: [] } },
                    {
                        model: Product, as: 'variants',
                        include: [
                            { model: ProductPrice, as: 'prices' },
                            { model: ProductMedia, as: 'media', order: [['displayOrder', 'ASC']] },
                            { model: ProductCategory, as: 'categories', through: { attributes: [] } }
                        ]
                    }
                ]
            });
 
            if (!result) return res.status(404).json({ error: 'Product not found' });
            
            // Add variant count separately if needed (count is simpler as a separate call)
            let variantCount = 0;
            if (!isAdmin && result.variantId) {
                variantCount = await Product.count({ where: { variantId: result.variantId } });
            }

            return res.status(200).json({
                ...result.toJSON(),
                variantCount
            });
        }

        // --- STANDARD LISTING FETCH ---
        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: ProductPrice, as: 'prices', separate: true },
                { 
                    model: ProductBundle, as: 'bundleItems', separate: true,
                    include: [
                        { 
                            model: Product, as: 'product',
                            include: [{ model: ProductMedia, as: 'media' }]
                        }
                    ]
                },
                { model: ProductMedia, as: 'media', separate: true, order: [['displayOrder', 'ASC']] },
                { model: ProductCategory, as: 'categories', through: { attributes: [] } },
                {
                    model: Product, as: 'variants', separate: true,
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media', order: [['displayOrder', 'ASC']] },
                        { model: ProductCategory, as: 'categories', through: { attributes: [] } },
                    ],
                },
            ],
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        // Add variant count to each product (only for public/shop)
        if (!isAdmin) {
            const productsWithVariantCount = await Promise.all(products.map(async (product) => {
                let variantCount = 0;
                if (product.variantId) {
                    variantCount = await Product.count({ where: { variantId: product.variantId } });
                }
                
                return {
                    ...product.toJSON(),
                    variantCount
                };
            }));
            return res.status(200).json(productsWithVariantCount);
        }

        res.status(200).json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { getProducts };
