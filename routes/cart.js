const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateQuantity, removeFromCart } = require('../controllers/cartController');

router.get('/', getCart);
router.post('/add', addToCart);
router.patch('/item/:id', updateQuantity);
router.delete('/item/:id', removeFromCart);

module.exports = router;
