const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Form = sequelize.define('Form', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        name: { type: DataTypes.STRING, allowNull: false },
        data: { type: DataTypes.JSONB, allowNull: false }
    }, {
        timestamps: true
    });

    return Form;
};