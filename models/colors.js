const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Colors = sequelize.define('Colors', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        color: { type: DataTypes.STRING, allowNull: false },
        colorName: { type: DataTypes.STRING, allowNull: false }
    }, {
        timestamps: true
    });

    return Colors;
};