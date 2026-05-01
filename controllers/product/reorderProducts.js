const { Product, sequelize } = require('../../models');

const reorderProducts = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { orders } = req.body; // Expecting [{ id: 1, displayOrder: 0 }, { id: 2, displayOrder: 1 }, ...]

        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: 'Orders must be an array of { id, displayOrder }' });
        }

        for (const item of orders) {
            await Product.update(
                { displayOrder: item.displayOrder },
                { 
                    where: { id: item.id },
                    transaction: t 
                }
            );
        }

        await t.commit();
        res.status(200).json({ message: 'Products reordered successfully' });
    } catch (err) {
        await t.rollback();
        console.error('Error reordering products:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { reorderProducts };
