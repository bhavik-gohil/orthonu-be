const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CouponUse = sequelize.define('CouponUse', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        couponId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['couponId'] },
            { fields: ['userId'] },
            { fields: ['couponId', 'userId'] }, // composite for counting uses per user
        ],
    });

    CouponUse.associate = (models) => {
        CouponUse.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
        CouponUse.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return CouponUse;
};
