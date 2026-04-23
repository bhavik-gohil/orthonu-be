const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductBundle = sequelize.define('ProductBundle', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        productId: { type: DataTypes.INTEGER, allowNull: false }, // product bundle
        productRefId: { type: DataTypes.INTEGER, allowNull: false } // products in bundle
    }, {
        timestamps: true,
        indexes: [
            { fields: ['productId'] },
        ],
    });

    ProductBundle.associate = (models) => {
        ProductBundle.belongsTo(models.Product, { foreignKey: 'productId', as: 'bundle' });
    };

    return ProductBundle;
};