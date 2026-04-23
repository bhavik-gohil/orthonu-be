const { Product, sequelize } = require('../../models');

const updateDefaultVariant = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Resolve the variant group id
        let groupId;
        if (product.variantId !== null) {
            // This product is itself a variant
            groupId = product.variantId;
        } else {
            // Check if this base product has any variants
            const variantCount = await Product.count({ where: { variantId: product.id } });
            if (variantCount === 0) {
                await t.rollback();
                return res.status(400).json({ error: 'This product has no variants.' });
            }
            groupId = product.id;
        }

        // Set all in group to false, then set target to true
        await Product.update({ isDefaultVariant: false }, { where: { variantId: groupId }, transaction: t });
        await Product.update({ isDefaultVariant: true }, { where: { id: product.id }, transaction: t });

        await t.commit();

        const updated = await Product.findByPk(product.id);
        return res.status(200).json(updated);
    } catch (err) {
        await t.rollback();
        console.error('Error updating default variant:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { updateDefaultVariant };
