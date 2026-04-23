const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Testimonial = sequelize.define('Testimonial', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        text: { type: DataTypes.TEXT, allowNull: false },
        by: { type: DataTypes.STRING, allowNull: false },
    }, {
        timestamps: true,
    });

    return Testimonial;
};
