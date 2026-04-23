const fs = require('fs');
const path = require('path');
const { Product, ProductPrice, ProductBundle, ProductMedia, sequelize } = require('../../models');
const { Op } = require('sequelize');
const { createProductSchema } = require('../../validation/product');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20 MB

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function saveFile(buffer, originalname) {
    const filename = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    return `/uploads/${filename}`;
}

function parseField(value) {
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
    }
    return value;
}

async function createMediaRecords({ productId, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, keepMediaIds, t }) {
    if (keepMediaIds !== undefined) {
        // Delete media NOT in the keep list
        await ProductMedia.destroy({
            where: {
                productId,
                id: { [Op.notIn]: keepMediaIds }
            },
            transaction: t
        });
    }

    // Get the highest existing displayOrder to continue from there
    const maxOrder = await ProductMedia.max('displayOrder', {
        where: { productId },
        transaction: t
    });
    let displayOrder = (maxOrder || -1) + 1;

    const mediaRecords = [];

    // Standard images first (in order)
    if (standardImages && standardImages.length > 0) {
        for (const file of standardImages) {
            const filePath = saveFile(file.buffer, file.originalname);
            mediaRecords.push({ productId, media: filePath, type: 'image', isExtra: false, displayOrder: displayOrder++ });
        }
    }

    // Standard YouTube URLs (in order)
    if (standardYoutubeUrls && standardYoutubeUrls.length > 0) {
        for (const url of standardYoutubeUrls) {
            mediaRecords.push({ productId, media: url, type: 'video', isExtra: false, displayOrder: displayOrder++ });
        }
    }

    // Extra media (in order)
    if (extraMediaMeta && extraMediaMeta.length > 0) {
        for (const meta of extraMediaMeta) {
            if (meta.type === 'video') {
                mediaRecords.push({ productId, media: meta.youtubeUrl, type: 'video', isExtra: true, displayOrder: displayOrder++ });
            } else {
                const file = extraFiles[meta.fileIndex];
                if (file) {
                    const filePath = saveFile(file.buffer, file.originalname);
                    mediaRecords.push({ productId, media: filePath, type: meta.type, isExtra: true, displayOrder: displayOrder++ });
                }
            }
        }
    }

    if (mediaRecords.length > 0) {
        await ProductMedia.bulkCreate(mediaRecords, { transaction: t });
    }
}

const createProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const body = { ...req.body };
        body.prices = parseField(body.prices);
        body.bundleItems = parseField(body.bundleItems);
        body.extraMediaMeta = parseField(body.extraMediaMeta);
        body.standardYoutubeUrls = parseField(body.standardYoutubeUrls);
        body.additionalInfo = parseField(body.additionalInfo);
        body.isBundle = body.isBundle === 'true' || body.isBundle === true;

        const { error, value } = createProductSchema.validate(body, { abortEarly: false });
        if (error) {
            await t.rollback();
            return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
        }

        const { prices, bundleItems, extraMediaMeta, standardYoutubeUrls, isDefaultVariant: _dv, ...productData } = value;

        const standardImages = (req.files && req.files['standardImages']) || [];
        const extraFiles = (req.files && req.files['extraFiles']) || [];

        if (standardImages.length < 1) {
            await t.rollback();
            return res.status(400).json({ error: 'At least one standard image is required.' });
        }
        if (standardImages.length > 10) {
            await t.rollback();
            return res.status(400).json({ error: 'Maximum 10 standard images allowed.' });
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

        await createMediaRecords({ productId: product.id, standardImages, standardYoutubeUrls, extraMediaMeta, extraFiles, t });

        if (value.isBundle && bundleItems && bundleItems.length > 0) {
            await ProductBundle.bulkCreate(
                bundleItems.map(b => ({ ...b, productId: product.id })),
                { transaction: t }
            );
        }

        await t.commit();

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
        console.error('Error creating product:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { createProduct, createMediaRecords, parseField, saveFile, UPLOADS_DIR, MAX_IMAGE_SIZE, MAX_PDF_SIZE };
