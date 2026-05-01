const { Product, ProductPrice, ProductBundle, ProductMedia, ProductCategory, ProductCategoryLink, sequelize } = require('../../models');
const { createProductSchema } = require('../../validation/product');
const { createMediaRecords, parseField, cleanupWrittenFiles, clearFileTracker, UPLOADS_DIR, MAX_IMAGE_SIZE, MAX_PDF_SIZE } = require('./createProduct');

const updateProduct = async (req, res) => {
    const { id } = req.params;
    clearFileTracker();
    const t = await sequelize.transaction();
    try {
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found.' });
        }

        const body = { ...req.body };
        if (body.prices) body.prices = parseField(body.prices);
        if (body.bundleItems) body.bundleItems = parseField(body.bundleItems);
        if (body.extraMediaMeta) body.extraMediaMeta = parseField(body.extraMediaMeta);
        if (body.standardYoutubeUrls) body.standardYoutubeUrls = parseField(body.standardYoutubeUrls);
        if (body.keepMediaIds) body.keepMediaIds = parseField(body.keepMediaIds);
        if (body.mediaLayout) body.mediaLayout = parseField(body.mediaLayout);
        if (body.additionalInfo) body.additionalInfo = parseField(body.additionalInfo);
        if (body.isBundle !== undefined) body.isBundle = body.isBundle === 'true' || body.isBundle === true;

        const { error, value } = createProductSchema.validate(body, { abortEarly: false, allowUnknown: true });
        if (error) {
            await t.rollback();
            return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
        }

        // Strip non-product fields to avoid leaking them into product.update()
        const { prices, bundleItems, extraMediaMeta, standardYoutubeUrls, keepMediaIds, mediaLayout, standardImages: _si, extraFiles: _ef, productCategory: categoryName, ...productData } = value;

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

        // Update Media: keepMediaIds determines which existing media to retain,
        // createMediaRecords handles deletion of non-kept media and adding new media.
        const standardImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'standardImages') : [];
        const extraFiles = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'extraFiles') : [];

        await createMediaRecords({ productId: id, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, keepMediaIds, mediaLayout, t });

        // Bundle items
        if (value.isBundle && bundleItems) {
            await ProductBundle.destroy({ where: { productId: id }, transaction: t });
            await ProductBundle.bulkCreate(
                bundleItems.map(b => ({ ...b, productId: id })),
                { transaction: t }
            );
        }

        // Sync categories via junction table — always clear + re-create
        await ProductCategoryLink.destroy({ where: { productId: id }, transaction: t });
        if (categoryName) {
            const cat = await ProductCategory.findOne({ 
                where: { productCategory: categoryName }, 
                transaction: t 
            });
            if (cat) {
                await ProductCategoryLink.create({
                    productId: id,
                    categoryId: cat.id
                }, { transaction: t });
            }
        }

        await t.commit();
        clearFileTracker();

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
        cleanupWrittenFiles();
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { updateProduct };
