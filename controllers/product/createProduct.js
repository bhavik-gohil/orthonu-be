const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Product, ProductPrice, ProductBundle, ProductMedia, ProductCategory, ProductCategoryLink, sequelize } = require('../../models');
const { Op } = require('sequelize');
const { createProductSchema } = require('../../validation/product');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20 MB

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Tracks files written during a transaction for rollback cleanup
const _writtenFiles = [];

function saveFile(buffer, originalname) {
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const filename = `${Date.now()}-${randomSuffix}-${originalname.replace(/\s+/g, '_')}`;
    const fullPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    _writtenFiles.push(fullPath);
    return `/uploads/${filename}`;
}

function cleanupWrittenFiles() {
    while (_writtenFiles.length > 0) {
        const filePath = _writtenFiles.pop();
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* best effort */ }
    }
}

function clearFileTracker() {
    _writtenFiles.length = 0;
}

function parseField(value) {
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
    }
    return value;
}

async function createMediaRecords({ productId, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, keepMediaIds, mediaLayout, t }) {
    // 1. Delete media NOT in the keep list (if provided)
    if (keepMediaIds !== undefined) {
        const mediaToDelete = await ProductMedia.findAll({
            where: {
                productId,
                id: { [Op.notIn]: keepMediaIds }
            },
            transaction: t
        });

        for (const media of mediaToDelete) {
            if (media.media && media.media.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../../public', media.media);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.warn(`Failed to delete media file: ${filePath}`, err);
                }
            }
        }

        await ProductMedia.destroy({
            where: {
                productId,
                id: { [Op.notIn]: keepMediaIds }
            },
            transaction: t
        });
    }

    // 2. Use mediaLayout if provided for explicit interleaved ordering
    if (mediaLayout && mediaLayout.length > 0) {
        const existingMedia = await ProductMedia.findAll({ where: { productId }, transaction: t });
        
        for (let i = 0; i < mediaLayout.length; i++) {
            const item = mediaLayout[i];
            const displayOrder = i;
            const isExtra = !!item.isExtra;

            if (item.id) {
                // Update existing media order and extra status
                const media = existingMedia.find(m => m.id === item.id);
                if (media) {
                    const updateData = { displayOrder, isExtra };
                    if (item.type === 'video' && item.url) {
                        updateData.media = item.url;
                    }
                    await media.update(updateData, { transaction: t });
                } else {
                    // Variant creation edge case: item.id refers to a parent media item not found under current productId.
                    // Let's duplicate the original media record to the current product.
                    const originalMedia = await ProductMedia.findByPk(item.id, { transaction: t });
                    if (originalMedia) {
                        await ProductMedia.create({
                            productId,
                            media: item.type === 'video' && item.url ? item.url : originalMedia.media,
                            type: item.type,
                            isExtra,
                            displayOrder
                        }, { transaction: t });
                    }
                }
            } else if (item.type === 'video' && item.url) {
                // New video URL (YouTube/Vimeo)
                // Check if this URL already exists for this product to avoid duplicates
                const existing = existingMedia.find(m => m.media === item.url && m.type === 'video');
                if (existing) {
                    await existing.update({ displayOrder, isExtra }, { transaction: t });
                } else {
                    await ProductMedia.create({ productId, media: item.url, type: 'video', isExtra, displayOrder }, { transaction: t });
                }
            } else if (item.type === 'image' && item.fileIndex !== undefined) {
                // New image file from multipart
                const files = isExtra ? extraFiles : standardImages;
                const file = files[item.fileIndex];
                if (file) {
                    const filePath = saveFile(file.buffer, file.originalname);
                    await ProductMedia.create({ productId, media: filePath, type: 'image', isExtra, displayOrder }, { transaction: t });
                }
            }
        }
        return;
    }

    // 3. Fallback to legacy block-based ordering (Images first, then Videos, then Extra)
    const existingMedia = await ProductMedia.findAll({ where: { productId }, transaction: t });
    let displayOrder = 0;
    const findExisting = (content, type) => existingMedia.find(m => m.media === content && m.type === type);

    if (standardImages && standardImages.length > 0) {
        for (const file of standardImages) {
            const filePath = saveFile(file.buffer, file.originalname);
            await ProductMedia.create({ productId, media: filePath, type: 'image', isExtra: false, displayOrder: displayOrder++ }, { transaction: t });
        }
    }

    if (standardYoutubeUrls && standardYoutubeUrls.length > 0) {
        for (const url of standardYoutubeUrls) {
            const existing = findExisting(url, 'video');
            if (existing) {
                await existing.update({ displayOrder: displayOrder++, isExtra: false }, { transaction: t });
            } else {
                await ProductMedia.create({ productId, media: url, type: 'video', isExtra: false, displayOrder: displayOrder++ }, { transaction: t });
            }
        }
    }

    if (extraMediaMeta && extraMediaMeta.length > 0) {
        for (const meta of extraMediaMeta) {
            if (meta.type === 'video') {
                const existing = findExisting(meta.youtubeUrl, 'video');
                if (existing) {
                    await existing.update({ displayOrder: displayOrder++, isExtra: true }, { transaction: t });
                } else {
                    await ProductMedia.create({ productId, media: meta.youtubeUrl, type: 'video', isExtra: true, displayOrder: displayOrder++ }, { transaction: t });
                }
            } else if (meta.fileIndex !== undefined && extraFiles[meta.fileIndex]) {
                const file = extraFiles[meta.fileIndex];
                const filePath = saveFile(file.buffer, file.originalname);
                await ProductMedia.create({ productId, media: filePath, type: meta.type, isExtra: true, displayOrder: displayOrder++ }, { transaction: t });
            }
        }
    }

    // Update orders for remaining kept media that weren't in the explicit layout/lists
    const processedIds = existingMedia.filter(m => m.displayOrder < displayOrder).map(m => m.id);
    const remainingMedia = existingMedia.filter(m => !processedIds.includes(m.id));
    for (const m of remainingMedia) {
        await m.update({ displayOrder: displayOrder++ }, { transaction: t });
    }
}

const createProduct = async (req, res) => {
    clearFileTracker();
    const t = await sequelize.transaction();
    try {
        const body = { ...req.body };
        body.prices = parseField(body.prices);
        body.bundleItems = parseField(body.bundleItems);
        body.extraMediaMeta = parseField(body.extraMediaMeta);
        body.standardYoutubeUrls = parseField(body.standardYoutubeUrls);
        body.mediaLayout = parseField(body.mediaLayout);
        body.additionalInfo = parseField(body.additionalInfo);
        body.isBundle = body.isBundle === 'true' || body.isBundle === true;

        const { error, value } = createProductSchema.validate(body, { abortEarly: false });
        if (error) {
            await t.rollback();
            return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
        }

        const { prices, bundleItems, extraMediaMeta, standardYoutubeUrls, mediaLayout, standardImages: _si, extraFiles: _ef, keepMediaIds: _km, productCategory: categoryName, ...productData } = value;

        const standardImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'standardImages') : [];
        const extraFiles = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'extraFiles') : [];

        if (standardImages.length < 1) {
            await t.rollback();
            return res.status(400).json({ error: 'At least one standard image is required.' });
        }
        if (standardImages.length > 30) {
            await t.rollback();
            return res.status(400).json({ error: 'Maximum 30 standard images allowed.' });
        }
        
        // Validate first media is an image
        if (standardImages[0] && !standardImages[0].mimetype.startsWith('image/')) {
            await t.rollback();
            return res.status(400).json({ error: 'First media must be an image.' });
        }
        
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

        // Create base product (variantId = null, isDefaultVariant = false)
        const product = await Product.create({
            ...productData,
            variantId: null,
            isDefaultVariant: false,
            isVariant: false,
        }, { transaction: t });

        if (prices && prices.length > 0) {
            await ProductPrice.bulkCreate(
                prices.map(p => ({ ...p, productId: product.id })),
                { transaction: t }
            );
        }

        await createMediaRecords({ productId: product.id, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, mediaLayout, t });

        if (value.isBundle && bundleItems && bundleItems.length > 0) {
            await ProductBundle.bulkCreate(
                bundleItems.map(b => ({ ...b, productId: product.id })),
                { transaction: t }
            );
        }

        // Link category via junction table
        if (categoryName) {
            const cat = await ProductCategory.findOne({ 
                where: { productCategory: categoryName }, 
                transaction: t 
            });
            if (cat) {
                await ProductCategoryLink.create({
                    productId: product.id,
                    categoryId: cat.id
                }, { transaction: t });
            }
        }

        await t.commit();
        clearFileTracker();

        const result = await Product.findByPk(product.id, {
            include: [
                { model: ProductPrice, as: 'prices' },
                { model: ProductBundle, as: 'bundleItems' },
                { model: ProductMedia, as: 'media' },
                { model: Product, as: 'variants', include: [{ model: ProductPrice, as: 'prices' }, { model: ProductMedia, as: 'media' }] },
            ],
        });

        return res.status(201).json(result);

    } catch (err) {
        await t.rollback();
        cleanupWrittenFiles();
        console.error('Error creating product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { createProduct, createMediaRecords, parseField, saveFile, cleanupWrittenFiles, clearFileTracker, UPLOADS_DIR, MAX_IMAGE_SIZE, MAX_PDF_SIZE };
