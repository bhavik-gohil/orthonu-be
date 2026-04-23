const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductPrice = sequelize.define('ProductPrice', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        productId: { type: DataTypes.INTEGER, allowNull: false }, // foreignkey to Product
        price: { type: DataTypes.FLOAT, allowNull: false },

        userType: { type: DataTypes.STRING, allowNull: true },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['productId'] },
        ],
    });

    ProductPrice.associate = (models) => {
        ProductPrice.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return ProductPrice;
};