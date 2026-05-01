const { Product, ProductPrice, ProductBundle, ProductMedia, ProductCategory, ProductCategoryLink, sequelize } = require('../../models');
const { Op } = require('sequelize');
const { addVariantSchema } = require('../../validation/product');
const { createMediaRecords, parseField, cleanupWrittenFiles, clearFileTracker, MAX_IMAGE_SIZE, MAX_PDF_SIZE } = require('./createProduct');

const addVariant = async (req, res) => {
    clearFileTracker();
    const t = await sequelize.transaction();
    try {
        // Parse multipart fields
        const body = { ...req.body };
        body.prices = parseField(body.prices);
        body.bundleItems = parseField(body.bundleItems);
        body.extraMediaMeta = parseField(body.extraMediaMeta);
        body.standardYoutubeUrls = parseField(body.standardYoutubeUrls);
        body.additionalInfo = parseField(body.additionalInfo);
        body.mediaLayout = parseField(body.mediaLayout);
        body.keepMediaIds = parseField(body.keepMediaIds);
        body.isBundle = body.isBundle === 'true' || body.isBundle === true;
        body.isDefaultVariant = body.isDefaultVariant === 'true' || body.isDefaultVariant === true;

        // Validate
        const { error, value } = addVariantSchema.validate(body, { abortEarly: false });
        if (error) {
            await t.rollback();
            return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
        }

        // Load parent product
        const parent = await Product.findByPk(req.params.id, { transaction: t });
        if (!parent) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Resolve variantId (flatten — all variants share the same group id)
        const resolvedVariantId = parent.variantId !== null ? parent.variantId : parent.id;

        // File validation
        const standardImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'standardImages') : [];
        const extraFiles = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'extraFiles') : [];

        for (const img of standardImages) {
            if (img.size > MAX_IMAGE_SIZE) {
                await t.rollback();
                return res.status(400).json({ error: `Image "${img.originalname}" exceeds the 10 MB size limit.` });
            }
        }
        for (const file of extraFiles) {
            const limit = file.mimetype === 'application/pdf' ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
            if (file.size > limit) {
                const limitLabel = file.mimetype === 'application/pdf' ? '20 MB' : '10 MB';
                await t.rollback();
                return res.status(400).json({ error: `Extra file "${file.originalname}" exceeds the ${limitLabel} size limit.` });
            }
        }

        // Determine isDefaultVariant: force true if this is the first variant in the group
        const existingCount = await Product.count({ where: { variantId: resolvedVariantId } });
        const isFirstVariant = existingCount === 0;
        const isDefault = isFirstVariant ? false : value.isDefaultVariant; // First variant is NOT default, base product remains default

        const { prices, bundleItems, extraMediaMeta, standardYoutubeUrls, isDefaultVariant: _dv, productCategory: categoryName, ...productData } = value;

        const finalData = {
            name: productData.name ?? parent.name,
            intro: productData.intro ?? parent.intro,
            description: productData.description ?? parent.description,
            tag: productData.tag ?? parent.tag,
            additionalInfo: productData.additionalInfo ?? parent.additionalInfo,
            color: productData.color ?? parent.color,
            variantName: productData.variantName ?? null,
            isBundle: productData.isBundle !== undefined ? productData.isBundle : parent.isBundle,
            variantId: resolvedVariantId,
            isDefaultVariant: isDefault,
            isVariant: true,
        };

        const variant = await Product.create(finalData, { transaction: t });

        // Update base product with variant name if provided (only for first variant)
        if (isFirstVariant && value.baseVariantName && !parent.variantName) {
            await parent.update({ 
                variantName: value.baseVariantName,
                variantId: resolvedVariantId,
                isDefaultVariant: true, // Base product remains default
                isVariant: true
            }, { transaction: t });
        }

        // If setting new variant as default, unset others in the group (including base product)
        if (isDefault) {
            await Product.update(
                { isDefaultVariant: false },
                { where: { variantId: resolvedVariantId, id: { [Op.ne]: variant.id } }, transaction: t }
            );
            await variant.update({ isDefaultVariant: true }, { transaction: t });
        }

        // Inherit Prices if not provided
        const finalPrices = (prices && prices.length > 0) ? prices : await ProductPrice.findAll({ where: { productId: parent.id } });
        await ProductPrice.bulkCreate(
            finalPrices.map(p => ({
                userType: p.userType,
                price: p.price,
                productId: variant.id
            })),
            { transaction: t }
        );

        // Inherit Media if no new media provided
        const hasNewMedia = standardImages.length > 0 || (standardYoutubeUrls && standardYoutubeUrls.length > 0) || (extraMediaMeta && extraMediaMeta.length > 0);
        if (!hasNewMedia) {
            const parentMedia = await ProductMedia.findAll({ 
                where: { productId: parent.id },
                order: [['displayOrder', 'ASC']]
            });
            await ProductMedia.bulkCreate(
                parentMedia.map(m => ({
                    media: m.media,
                    type: m.type,
                    isExtra: m.isExtra,
                    displayOrder: m.displayOrder,
                    productId: variant.id
                })),
                { transaction: t }
            );
        } else {
            const { extraMediaMeta, standardYoutubeUrls, mediaLayout } = value;
            await createMediaRecords({ productId: variant.id, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, mediaLayout, t });
        }

        if (finalData.isBundle) {
            const finalBundleItems = (bundleItems && bundleItems.length > 0) ? bundleItems : await ProductBundle.findAll({ where: { productId: parent.id } });
            await ProductBundle.bulkCreate(
                finalBundleItems.map(b => ({
                    productRefId: b.productRefId,
                    productId: variant.id
                })),
                { transaction: t }
            );
        }

        // Inherit or set categories via junction table
        if (categoryName) {
            const cat = await ProductCategory.findOne({ 
                where: { productCategory: categoryName }, 
                transaction: t 
            });
            if (cat) {
                await ProductCategoryLink.create({
                    productId: variant.id,
                    categoryId: cat.id
                }, { transaction: t });
            }
        } else {
            // Inherit all categories from parent
            const parentCats = await ProductCategoryLink.findAll({ where: { productId: parent.id }, transaction: t });
            if (parentCats.length > 0) {
                await ProductCategoryLink.bulkCreate(
                    parentCats.map(pc => ({
                        productId: variant.id,
                        categoryId: pc.categoryId
                    })),
                    { transaction: t }
                );
            }
        }

        await t.commit();
        clearFileTracker();

        const result = await Product.findByPk(variant.id, {
            include: [
                { model: ProductPrice, as: 'prices' },
                { model: ProductBundle, as: 'bundleItems' },
                { model: ProductMedia, as: 'media' },
            ],
        });

        return res.status(201).json(result);

    } catch (err) {
        await t.rollback();
        cleanupWrittenFiles();
        console.error('Error adding variant:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { addVariant };
