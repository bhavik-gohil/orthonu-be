const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductInProductGroup = sequelize.define('ProductInProductGroup', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        groupName: { type: DataTypes.STRING, allowNull: false }, // btree indexed, not a FK
        productId: { type: DataTypes.INTEGER, allowNull: false }, // btree indexed, not a FK
    }, {
        timestamps: true,
        indexes: [
            { using: 'BTREE', fields: ['groupName'] },
            { using: 'BTREE', fields: ['productId'] },
            // Prevent duplicate product in same group
            { unique: true, fields: ['groupName', 'productId'] },
        ],
    });

    return ProductInProductGroup;
};
