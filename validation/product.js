const Joi = require('joi');
const { USER_TYPES } = require('../utils/constants');

const priceSchema = Joi.object({
    price: Joi.number().positive().required(),
    userType: Joi.string().valid(USER_TYPES.REGULAR, USER_TYPES.PROFESSIONAL).required(),
});

const extraMediaMetaSchema = Joi.object({
    type: Joi.string().valid('image', 'video', 'pdf').required(),
    youtubeUrl: Joi.string().uri().when('type', {
        is: 'video',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
    fileIndex: Joi.number().integer().min(0).when('type', {
        is: Joi.valid('image', 'pdf'),
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

    // Standard media: optional YouTube embedded URLs (array)
    standardYoutubeUrls: Joi.array().items(Joi.string().uri()).optional(),

    // Extra media metadata (optional, max 5)
    extraMediaMeta: Joi.array().items(extraMediaMetaSchema).max(5).optional(),

    // Per-product fields
    tag: Joi.string().allow(null, '').optional(),
    description: Joi.string().allow(null, '').optional(),
    additionalInfo: Joi.object().allow(null).optional(),
    variantName: Joi.string().allow(null, '').optional(),
    color: Joi.string().allow(null, '').optional(),

    // Bundle items (required when isBundle=true)
    bundleItems: Joi.array().items(bundleItemSchema).when('isBundle', {
        is: true,
        then: Joi.array().min(1).required(),
        otherwise: Joi.array().optional(),
    }),

    // Allow these to be present in body (sometimes sent by clients even if using multipart)
    standardImages: Joi.any().optional(),
    extraFiles: Joi.any().optional(),
};

const createProductSchema = Joi.object({
    ...baseProductSchema,
});

const addVariantSchema = Joi.object({
    ...baseProductSchema,
    variantName: Joi.string().allow(null, ''),
    baseVariantName: Joi.string().allow(null, '').optional(),
    isDefaultVariant: Joi.boolean().default(false),
});

module.exports = { createProductSchema, addVariantSchema };
