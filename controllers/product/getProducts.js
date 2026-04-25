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

        // --- OPTIMIZATION: SINGLE PRODUCT FETCH (BY UID) ---
        if (req.query.uid) {
            // 1. Fetch the core product first (needed for the ID to fetch associations)
            const product = await Product.findOne({
                where: { uid: req.query.uid }
            });

            if (!product) return res.status(404).json({ error: 'Product not found' });

            const productId = product.id;
            const variantId = product.variantId;

            // 2. Fetch all associations in PARALLEL
            const [prices, bundleItems, media, variants, variantCount] = await Promise.all([
                ProductPrice.findAll({ where: { productId }, attributes: { exclude: ['createdAt', 'updatedAt'] } }),
                ProductBundle.findAll({ 
                    where: { productId },
                    include: [{ 
                        model: Product, as: 'product',
                        include: [{ model: ProductMedia, as: 'media' }] 
                    }]
                }),
                ProductMedia.findAll({ 
                    where: { productId }, 
                    order: [['displayOrder', 'ASC']] 
                }),
                // Only fetch variants if this product belongs to a variant group
                variantId ? Product.findAll({ 
                    where: { variantId },
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media' }
                    ]
                }) : Promise.resolve([]),
                // Only count variants if public
                (!isAdmin && variantId) ? Product.count({ where: { variantId } }) : Promise.resolve(0)
            ]);

            // 3. Assemble and return
            const result = {
                ...product.toJSON(),
                prices,
                bundleItems,
                media,
                variants,
                variantCount
            };

            return res.status(200).json(result);
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
                { model: ProductMedia, as: 'media', separate: true },
                {
                    model: Product, as: 'variants', separate: true,
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media' },
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
