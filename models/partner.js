const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Partner = sequelize.define('Partner', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        logo: { type: DataTypes.STRING, allowNull: true },   // image path
        learnMoreUrl: { type: DataTypes.STRING, allowNull: true },
    }, {
        timestamps: true,
    });

    return Partner;
};
