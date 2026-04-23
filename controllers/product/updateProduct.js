const { Product, ProductPrice, ProductBundle, ProductMedia, sequelize } = require('../../models');
const { createProductSchema } = require('../../validation/product'); // Reusing the schema (patch is partial validation usually, but we can reuse create schema)
const { createMediaRecords, parseField, UPLOADS_DIR, MAX_IMAGE_SIZE, MAX_PDF_SIZE } = require('./createProduct');

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    try {
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found.' });
        }

        const body = { ...req.body };
        // Parse JSON fields if they are strings
        if (body.prices) body.prices = parseField(body.prices);
        if (body.bundleItems) body.bundleItems = parseField(body.bundleItems);
        if (body.extraMediaMeta) body.extraMediaMeta = parseField(body.extraMediaMeta);
        if (body.standardYoutubeUrls) body.standardYoutubeUrls = parseField(body.standardYoutubeUrls);
        if (body.keepMediaIds) body.keepMediaIds = parseField(body.keepMediaIds);
        if (body.additionalInfo) body.additionalInfo = parseField(body.additionalInfo);
        if (body.isBundle !== undefined) body.isBundle = body.isBundle === 'true' || body.isBundle === true;

        // Validation - We use createProductSchema but make it optional if we wanted partial, 
        // but here the form sends the whole thing usually.
        const { error, value } = createProductSchema.validate(body, { abortEarly: false, allowUnknown: true });
        if (error) {
            await t.rollback();
            return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
        }

        const { prices, bundleItems, extraMediaMeta, standardYoutubeUrls, keepMediaIds, ...productData } = value;

        // Update basic fields
        await product.update(productData, { transaction: t });

        // Update Prices: Delete existing and recreate
        if (prices) {
            await ProductPrice.destroy({ where: { productId: id }, transaction: t });
            await ProductPrice.bulkCreate(
                prices.map(p => ({ ...p, productId: id })),
                { transaction: t }
            );
        }

        // Update Media: For now we just ADD new media if provided. 
        // If the user wants to clear old media, we'd need a way to track which ones to delete.
        // For simplicity: if NO new media is provided, keep old. If NEW is provided, keep old and ADD new.
        // Actually, a better "Update" for images is to allow the user to manage them.
        // But the current UI sends NEW files. 
        // Note: standardImages and extraFiles are NEW files. 
        // keepMediaIds covers existing media to retain.
        const standardImages = (req.files && req.files['standardImages']) || [];
        const extraFiles = (req.files && req.files['extraFiles']) || [];

        await createMediaRecords({ productId: id, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, keepMediaIds, t });

        // Bundle items
        if (value.isBundle && bundleItems) {
            await ProductBundle.destroy({ where: { productId: id }, transaction: t });
            await ProductBundle.bulkCreate(
                bundleItems.map(b => ({ ...b, productId: id })),
                { transaction: t }
            );
        }

        await t.commit();

        const result = await Product.findByPk(id, {
            include: [
                { model: ProductPrice, as: 'prices' },
                { model: ProductBundle, as: 'bundleItems' },
                { model: ProductMedia, as: 'media' },
                { model: Product, as: 'variants', include: [{ model: ProductPrice, as: 'prices' }, { model: ProductMedia, as: 'media' }] },
            ],
        });

        return res.status(200).json(result);

    } catch (err) {
        await t.rollback();
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { updateProduct };
