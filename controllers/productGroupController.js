const {
    ProductGroup,
    ProductInProductGroup,
    Product,
    ProductPrice,
    ProductMedia,
} = require('../models');

// ─── ProductGroup CRUD ──────────────────────────────────────────────────────

const getAllGroups = async (req, res) => {
    try {
        const groups = await ProductGroup.findAll({ order: [['createdAt', 'ASC']] });
        return res.status(200).json(groups);
    } catch (err) {
        console.error('getAllGroups error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const createGroup = async (req, res) => {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'name is required.' });
    }
    try {
        const group = await ProductGroup.create({ name: name.trim(), color: color || null });
        return res.status(201).json(group);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'A group with this name already exists.' });
        }
        console.error('createGroup error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const updateGroup = async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;
    try {
        const group = await ProductGroup.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Group not found.' });

        const oldName = group.name;
        if (name !== undefined) group.name = name.trim();
        if (color !== undefined) group.color = color;
        await group.save();

        // Update groupName references if name changed
        if (name && name.trim() !== oldName) {
            await ProductInProductGroup.update(
                { groupName: name.trim() },
                { where: { groupName: oldName } }
            );
        }

        return res.status(200).json(group);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'A group with this name already exists.' });
        }
        console.error('updateGroup error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const deleteGroup = async (req, res) => {
    const { id } = req.params;
    try {
        const group = await ProductGroup.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Group not found.' });

        // Remove all member rows
        await ProductInProductGroup.destroy({ where: { groupName: group.name } });
        await group.destroy();
        return res.status(200).json({ message: 'Group deleted.' });
    } catch (err) {
        console.error('deleteGroup error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// ─── ProductInProductGroup CRUD ─────────────────────────────────────────────

const getGroupItems = async (req, res) => {
    const { groupName } = req.params;
    try {
        const items = await ProductInProductGroup.findAll({
            where: { groupName },
            order: [['createdAt', 'ASC']],
        });

        // Enrich with product data
        const enriched = await Promise.all(
            items.map(async (item) => {
                const product = await Product.findByPk(item.productId, {
                    include: [
                        { model: ProductPrice, as: 'prices' },
                        { model: ProductMedia, as: 'media' },
                    ],
                });
                return { ...item.toJSON(), product: product ? product.toJSON() : null };
            })
        );
        return res.status(200).json(enriched);
    } catch (err) {
        console.error('getGroupItems error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const addProductToGroup = async (req, res) => {
    const { groupName } = req.params;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required.' });
    try {
        const item = await ProductInProductGroup.create({
            groupName,
            productId: parseInt(productId, 10),
        });
        return res.status(201).json(item);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Product already in this group.' });
        }
        console.error('addProductToGroup error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const removeItemFromGroup = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await ProductInProductGroup.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        await item.destroy();
        return res.status(200).json({ message: 'Removed.' });
    } catch (err) {
        console.error('removeItemFromGroup error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// ─── Public endpoint: all groups with their products ────────────────────────

const getGroupsWithProducts = async (req, res) => {
    try {
        const groups = await ProductGroup.findAll({ order: [['createdAt', 'ASC']] });

        const result = await Promise.all(
            groups.map(async (group) => {
                const items = await ProductInProductGroup.findAll({
                    where: { groupName: group.name },
                    order: [['createdAt', 'ASC']],
                });
                const products = await Promise.all(
                    items.map(async (item) => {
                        const p = await Product.findByPk(item.productId, {
                            include: [
                                { model: ProductPrice, as: 'prices' },
                                { model: ProductMedia, as: 'media' },
                            ],
                            order: [
                                [{ model: ProductMedia, as: 'media' }, 'displayOrder', 'ASC'],
                            ],
                        });
                        return p ? p.toJSON() : null;
                    })
                );
                return {
                    ...group.toJSON(),
                    products: products.filter(Boolean),
                };
            })
        );

        return res.status(200).json(result);
    } catch (err) {
        console.error('getGroupsWithProducts error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = {
    getAllGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupItems,
    addProductToGroup,
    removeItemFromGroup,
    getGroupsWithProducts,
};
