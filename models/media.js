const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Media = sequelize.define('Media', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        refId: { type: DataTypes.INTEGER, allowNull: false },
        refTable: { type: DataTypes.STRING, allowNull: true },

        media: { type: DataTypes.STRING, allowNull: false },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ['refId'] },
            { fields: ['refTable'] }
        ]
    });

    return Media;
};