const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Coupon = sequelize.define('Coupon', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        
        discountPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false }, // e.g. 15.00 for 15%
        maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // optional cap in dollars
        useCountPerUser: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
        advertiseToUser: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        
        discountName: { type: DataTypes.STRING, allowNull: false }, // e.g. "WELCOME20"
        header: { type: DataTypes.STRING, allowNull: false }, // e.g. "Welcome Discount"
        subHeader: { type: DataTypes.STRING, allowNull: true }, // optional subtitle
        
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['uid'] },
            { fields: ['discountName'], unique: true },
            { fields: ['isActive'] },
        ],
    });

    Coupon.associate = (models) => {
        Coupon.hasMany(models.CouponUse, { foreignKey: 'couponId', as: 'uses' });
    };

    return Coupon;
};
