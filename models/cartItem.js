const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CartItem = sequelize.define('CartItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        cartId: { type: DataTypes.INTEGER, allowNull: false },
        
        // Product information stored directly (no foreign key relation)
        productId: { type: DataTypes.INTEGER, allowNull: false }, // Reference only, not FK
        productName: { type: DataTypes.STRING, allowNull: false },
        productSlug: { type: DataTypes.STRING, allowNull: true }, // uid used as slug reference
        productImage: { type: DataTypes.STRING, allowNull: true }, // Main product image
        
        // Pricing information at time of adding to cart
        regularPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        professionalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        
        // Variant information
        variantName: { type: DataTypes.STRING, allowNull: true },
        color: { type: DataTypes.STRING, allowNull: true },
        
        // Cart item details
        quantity: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
        
        // Additional product info for reference
        productCategory: { type: DataTypes.STRING, allowNull: true },
        isBundle: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        timestamps: true
    });

    CartItem.associate = (models) => {
        CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
    };

    return CartItem;
};
