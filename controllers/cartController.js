const { Cart, CartItem, Product, ProductMedia, ProductPrice } = require('../models');

const getCart = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        const [cart] = await Cart.findOrCreate({
            where: { userId, status: 'active' },
            include: [{
                model: CartItem,
                as: 'items'
            }]
        });

        // Cart items now contain all product info directly, no need to join Product table
        res.json(cart);
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({ error: 'User ID and Product ID are required' });
        }

        // Fetch product details to store in cart
        const product = await Product.findByPk(productId, {
            include: [
                { model: ProductPrice, as: 'prices' },
                { model: ProductMedia, as: 'media', where: { isExtra: false }, required: false }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get the main product image
        const mainImage = product.media && product.media.length > 0 
            ? product.media.sort((a, b) => a.displayOrder - b.displayOrder)[0].media 
            : null;

        // Get prices
        const regularPrice = product.prices?.find(p => p.userType === 'regular')?.price || 0;
        const professionalPrice = product.prices?.find(p => p.userType === 'professional')?.price || null;

        const [cart] = await Cart.findOrCreate({
            where: { userId, status: 'active' }
        });

        // Check if item already exists in cart
        const existingItem = await CartItem.findOne({
            where: { cartId: cart.id, productId }
        });

        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
            await existingItem.save();
            return res.json({ message: 'Product quantity updated in cart', item: existingItem });
        }

        // Create new cart item with product snapshot
        const item = await CartItem.create({
            cartId: cart.id,
            productId: product.id,
            productName: product.name,
            productSlug: product.uid,  // Product has no slug field — use uid for URL building
            productImage: mainImage,
            regularPrice,
            professionalPrice,
            variantName: product.variantName,
            color: product.color,
            quantity,
            productCategory: product.productCategory,
            isBundle: product.isBundle
        });

        res.json({ message: 'Product added to cart', item });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

const updateQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        const item = await CartItem.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Cart item not found' });

        item.quantity = quantity;
        await item.save();

        res.json({ message: 'Quantity updated', item });
    } catch (err) {
        console.error('Error updating quantity:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await CartItem.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Cart item not found' });

        await item.destroy();
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart
};
