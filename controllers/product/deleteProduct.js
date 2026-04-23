const { Product, ProductPrice, ProductBundle, ProductMedia, sequelize } = require('../../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    
    try {
        const product = await Product.findByPk(id, {
            include: [
                { model: ProductMedia, as: 'media' },
                { model: ProductBundle, as: 'bundleItems' },
                { model: ProductPrice, as: 'prices' }
            ],
            transaction: t
        });

        if (!product) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Special handling for variant products
        if (product.isVariant && product.variantId) {
            // Check if this is the default variant
            if (product.isDefaultVariant) {
                // Find another variant to make default
                const otherVariant = await Product.findOne({
                    where: { 
                        variantId: product.variantId,
                        id: { [Op.ne]: product.id }
                    },
                    transaction: t
                });

                if (otherVariant) {
                    // Make another variant the default
                    await otherVariant.update({ isDefaultVariant: true }, { transaction: t });
                }
            }

            // Check if this is the last variant in the group
            const variantCount = await Product.count({
                where: { variantId: product.variantId },
                transaction: t
            });

            if (variantCount === 1) {
                // This is the last variant, reset the base product if it exists
                const baseProduct = await Product.findByPk(product.variantId, { transaction: t });
                if (baseProduct && baseProduct.id !== product.id) {
                    await baseProduct.update({
                        variantId: null,
                        isVariant: false,
                        isDefaultVariant: false,
                        variantName: null
                    }, { transaction: t });
                }
            }
        }

        // Delete associated media files from filesystem
        if (product.media && product.media.length > 0) {
            for (const media of product.media) {
                if (media.media && media.media.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, '../../public', media.media);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.warn(`Failed to delete media file: ${filePath}`, err);
                        // Continue with deletion even if file removal fails
                    }
                }
            }
        }

        // Delete associated records (cascade should handle this, but being explicit)
        await ProductMedia.destroy({ where: { productId: id }, transaction: t });
        await ProductBundle.destroy({ where: { productId: id }, transaction: t });
        await ProductPrice.destroy({ where: { productId: id }, transaction: t });

        // Delete the product itself
        await product.destroy({ transaction: t });

        await t.commit();

        return res.status(200).json({ 
            message: 'Product deleted successfully',
            deletedProduct: {
                id: product.id,
                name: product.name,
                isVariant: product.isVariant,
                variantId: product.variantId
            }
        });

    } catch (err) {
        await t.rollback();
        console.error('Error deleting product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { deleteProduct };