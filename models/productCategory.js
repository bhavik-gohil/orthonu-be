const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductCategory = sequelize.define('ProductCategory', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        productCategory: { type: DataTypes.STRING, allowNull: false },
        header: { type: DataTypes.STRING, allowNull: false }, // header text for category listing page
        text: { type: DataTypes.TEXT, allowNull: false }, // description text for category listing page
        image: { type: DataTypes.STRING, allowNull: false } // image reference for category listing page
    }, {
        timestamps: true
    });

    return ProductCategory;
};