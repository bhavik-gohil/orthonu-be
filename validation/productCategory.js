const Joi = require('joi');

const createProductCategorySchema = Joi.object({
    productCategory: Joi.string().required(),
    header: Joi.string().required(),
    text: Joi.string().required(),
    image: Joi.string().required()
});

const updateProductCategorySchema = Joi.object({
    productCategory: Joi.string().optional(),
    header: Joi.string().optional(),
    text: Joi.string().optional(),
    image: Joi.string().optional()
});

module.exports = {
    createProductCategorySchema,
    updateProductCategorySchema
};
