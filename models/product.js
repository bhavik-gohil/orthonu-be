const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },


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
        isDefaultVariant: { type: DataTypes.BOOLEAN, defaultValue: false },
        displayOrder: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['uid'] },
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
        // Many-to-many categories
        Product.belongsToMany(models.ProductCategory, { 
            through: models.ProductCategoryLink, 
            foreignKey: 'productId', 
            otherKey: 'categoryId',
            as: 'categories' 
        });
    };

    // Auto-assign displayOrder to the ID on creation if not specified
    Product.afterCreate(async (product, options) => {
        if (product.displayOrder === null) {
            await product.update({ displayOrder: product.id }, { transaction: options.transaction });
        }
    });

    return Product;
};
