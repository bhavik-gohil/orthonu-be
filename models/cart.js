const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Cart = sequelize.define('Cart', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: true }, // Allow anonymous carts?
        status: { type: DataTypes.STRING, defaultValue: 'active' } // active, abandoned, completed
    }, {
        timestamps: true
    });

    Cart.associate = (models) => {
        Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'items' });
        Cart.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return Cart;
};
