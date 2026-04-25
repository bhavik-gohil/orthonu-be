const { Product, ProductPrice, ProductBundle, ProductMedia } = require('../../models');
const { Op } = require('sequelize');

const getProducts = async (req, res) => {
    try {
        // Check if this is an admin request (has auth middleware)
        const isAdmin = req.user && req.user.role === 'main_admin';
        
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

        // Add specific UID filter if provided (crucial for product detail pages to avoid loading full catalog)
        if (req.query.uid) {
            whereClause.uid = req.query.uid;
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: ProductPrice, as: 'prices' },
                { 
                    model: ProductBundle, as: 'bundleItems',
                    include: [
                        { 
                            model: Product, as: 'product',
                            include: [{ model: ProductMedia, as: 'media' }]
                        }
                    ]
                },
                { model: ProductMedia, as: 'media' },
                {
                    model: Product, as: 'variants',
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media' },
                    ],
                },
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: ProductMedia, as: 'media' }, 'displayOrder', 'ASC'],
                [{ model: Product, as: 'variants' }, { model: ProductMedia, as: 'media' }, 'displayOrder', 'ASC']
            ],
        });

        // Add variant count to each product (only for public/shop)
        if (!isAdmin) {
            const productsWithVariantCount = await Promise.all(products.map(async (product) => {
                let variantCount = 0;
                if (product.variantId) {
                    // Count all products with the same variantId
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
