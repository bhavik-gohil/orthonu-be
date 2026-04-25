const { Product, ProductPrice, ProductBundle, ProductMedia } = require('../../models');

const getProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
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
                { model: ProductMedia, as: 'media', order: [['displayOrder', 'ASC']] },
                {
                    model: Product, as: 'variants',
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media', order: [['displayOrder', 'ASC']] },
                        { model: ProductBundle, as: 'bundleItems' },
                    ],
                },
            ],
            order: [[{ model: ProductMedia, as: 'media' }, 'displayOrder', 'ASC']],
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        return res.status(200).json(product);
    } catch (err) {
        console.error('Error fetching product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { getProduct };
