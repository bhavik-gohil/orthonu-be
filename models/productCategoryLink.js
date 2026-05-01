const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductCategoryLink = sequelize.define('ProductCategoryLink', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        productId: { type: DataTypes.INTEGER, allowNull: false },
        categoryId: { type: DataTypes.INTEGER, allowNull: false }
    }, {
        timestamps: true,
        indexes: [
            { fields: ['productId'] },
            { fields: ['categoryId'] },
            { unique: true, fields: ['productId', 'categoryId'] }
        ]
    });

    return ProductCategoryLink;
};
