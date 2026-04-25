const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Otp = sequelize.define('Otp', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        email: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING, allowNull: false },
        type: {
            type: DataTypes.ENUM('registration', 'admin_login'),
            allowNull: false
        },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
        attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
        isUsed: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        timestamps: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['code'] },
            { fields: ['type'] }
        ]
    });

    return Otp;
};
