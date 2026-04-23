const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductGroup = sequelize.define('ProductGroup', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        color: { type: DataTypes.STRING, allowNull: true }, // stored as hex/name string, not a relation
    }, {
        timestamps: true,
        indexes: [
            { fields: ['name'] },
            { fields: ['uid'] },
        ],
    });

    return ProductGroup;
};
