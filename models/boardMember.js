const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BoardMember = sequelize.define('BoardMember', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        position: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING, allowNull: true },
    }, {
        timestamps: true,
    });

    return BoardMember;
};
