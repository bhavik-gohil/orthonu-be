const Joi = require('joi');
const { USER_TYPES } = require('../utils/constants');

const priceSchema = Joi.object({
    price: Joi.number().positive().required(),
    userType: Joi.string().valid(USER_TYPES.REGULAR, USER_TYPES.PROFESSIONAL).required(),
});

const extraMediaMetaSchema = Joi.object({
    type: Joi.string().valid('image', 'video').required(),
    youtubeUrl: Joi.string().uri().when('type', {
        is: 'video',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
    fileIndex: Joi.number().integer().min(0).when('type', {
        is: 'image',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
});

const bundleItemSchema = Joi.object({
    productRefId: Joi.number().integer().positive().required(),
});

// Base schema shared by createProduct and addVariant
const baseProductSchema = {
    name: Joi.string().optional(),
    intro: Joi.string().optional(), // new field - to be shown on product card as well as product page
    productCategory: Joi.string().allow(null, '').optional(),

    isBundle: Joi.boolean().default(false).optional(),

    // Mandatory for BASE products, optional for variants/updates
    prices: Joi.array()
        .items(priceSchema)
        .min(1)
        .has(Joi.object({ userType: USER_TYPES.REGULAR }).unknown())
        .optional(),

    // Unified media layout for interleaved ordering
    mediaLayout: Joi.array().items(Joi.object({
        type: Joi.string().valid('image', 'video').required(),
        id: Joi.number().optional(), // For existing media
        url: Joi.string().uri().optional(), // For existing/new videos
        fileIndex: Joi.number().optional(), // For new images/files
        isExtra: Joi.boolean().default(false).optional(),
    })).optional(),

    // Legacy fields (optional for backward compatibility)
    standardYoutubeUrls: Joi.array().items(Joi.string().uri()).optional(),
    extraMediaMeta: Joi.array().items(extraMediaMetaSchema).max(10).optional(),

    // Per-product fields
    tag: Joi.string().allow(null, '').optional(),
    description: Joi.string().allow(null, '').optional(),
    additionalInfo: Joi.object().allow(null).optional(),
    variantName: Joi.string().allow(null, '').optional(),
    color: Joi.string().allow(null, '').optional(),

    // Bundle items (optional)
    bundleItems: Joi.array().items(bundleItemSchema).optional(),

    // Allow these to be present in body (sometimes sent by clients even if using multipart)
    standardImages: Joi.any().optional(),
    extraFiles: Joi.any().optional(),
    keepMediaIds: Joi.any().optional(),
};

const createProductSchema = Joi.object({
    ...baseProductSchema,
    // Override: name and prices are REQUIRED for new product creation
    name: Joi.string().required().messages({ 'any.required': 'Product name is required.' }),
    prices: Joi.array()
        .items(priceSchema)
        .min(1)
        .has(Joi.object({ userType: USER_TYPES.REGULAR }).unknown())
        .required()
        .messages({ 'any.required': 'At least one price (regular) is required.' }),
});

const addVariantSchema = Joi.object({
    ...baseProductSchema,
    variantName: Joi.string().allow(null, ''),
    baseVariantName: Joi.string().allow(null, '').optional(),
    isDefaultVariant: Joi.boolean().default(false),
});

module.exports = { createProductSchema, addVariantSchema };
