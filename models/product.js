const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },

        productCategory: { type: DataTypes.STRING, allowNull: true }, // dropdown text - source: ProductCategory table
        name: { type: DataTypes.STRING, allowNull: false },
        intro: { type: DataTypes.STRING, allowNull: true }, // new field - to be shown on product card as well as product page
        tag: { type: DataTypes.STRING, allowNull: true }, // optional tag to be shown in a pill

        description: { type: DataTypes.TEXT, allowNull: true },
        additionalInfo: { type: DataTypes.JSONB, allowNull: true }, // key value pair

        color: { type: DataTypes.STRING, allowNull: true }, // product card accent color, same with low opacity to be used for tab bg

        isBundle: { type: DataTypes.BOOLEAN, defaultValue: false }, // if toggled on, show other products which are not bundle or variants

        // Variant fields
        isVariant: { type: DataTypes.BOOLEAN, defaultValue: false }, // variant is just a product mapped with a variantId to a different product
        variantName: { type: DataTypes.STRING, allowNull: true }, // to display different variants in a variant product page, user can switch to different variant products
        variantId: { type: DataTypes.INTEGER, allowNull: true },       // a common id for all the product of a variant for reference grouping
        isDefaultVariant: { type: DataTypes.BOOLEAN, defaultValue: false }, // so, variant creation flow should be like this. 1. admin user creates a product, now in product view page in admin panel, there is button "Add Variant", admin user clicks it and a new Create Variant page opens. 2. here by default all the data from default variant loads, now user can update products fields and add variantName for new variant. 3. if user is adding first variant, this means, user also needs to add variantName for base product for which variant is being created. 4. also, isDefaultVariant should be set true for base product. everywhere product is displayed for consumers, all the variants can be displayed independently, on product view page, there should be pill like buttons to switch variant products.
    }, {
        timestamps: true,
        indexes: [
            { fields: ['uid'] },
            { fields: ['productCategory'] },
            { fields: ['name'] },
            { fields: ['variantId'] },
        ],
    });

    Product.associate = (models) => {
        Product.hasMany(models.ProductPrice, { foreignKey: 'productId', as: 'prices' });
        Product.hasMany(models.ProductBundle, { foreignKey: 'productId', as: 'bundleItems' });
        Product.hasMany(models.ProductMedia, { foreignKey: 'productId', as: 'media' });
        // Self-referential: variants of this product
        Product.hasMany(models.Product, { foreignKey: 'variantId', as: 'variants' });
    };

    return Product;
};
