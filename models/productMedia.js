const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductMedia = sequelize.define('ProductMedia', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        productId: { type: DataTypes.INTEGER, allowNull: false }, // foreignkey to Product
        media: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false }, // video/image/pdf
        isExtra: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }, // false=standard, true=extra/supplemental
        displayOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false } // to preserve upload order, first media must be image only
    }, {
        timestamps: true,
        indexes: [
            { fields: ['productId'] },
            { fields: ['productId', 'displayOrder'] },
        ],
    });

    ProductMedia.associate = (models) => {
        ProductMedia.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return ProductMedia;
};