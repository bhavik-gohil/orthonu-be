const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productGroupController');
const authMiddleware = require('../middleware/authMiddleware');
const { mainAdminOnly } = require('../middleware/roleMiddleware');

// ── Public ───────────────────────────────────────────
// GET /shop/product-groups  → all groups with their products
router.get('/public', ctrl.getGroupsWithProducts);

// ── Admin ────────────────────────────────────────────
// Groups
router.get('/', authMiddleware, mainAdminOnly, ctrl.getAllGroups);
router.post('/', authMiddleware, mainAdminOnly, ctrl.createGroup);
router.put('/:id', authMiddleware, mainAdminOnly, ctrl.updateGroup);
router.delete('/:id', authMiddleware, mainAdminOnly, ctrl.deleteGroup);

// Items within a group
router.get('/:groupName/items', authMiddleware, mainAdminOnly, ctrl.getGroupItems);
router.post('/:groupName/items', authMiddleware, mainAdminOnly, ctrl.addProductToGroup);
router.delete('/items/:id', authMiddleware, mainAdminOnly, ctrl.removeItemFromGroup);

module.exports = router;
