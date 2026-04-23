require('dotenv').config();
const { sequelize } = require('../models');

async function run() {
    const qi = sequelize.getQueryInterface();
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Add new columns
        try {
            await qi.addColumn('Products', 'sku', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true, // temporarily nullable for migration; enforce NOT NULL after backfill
                unique: true,
            });
            console.log('Added: sku');
        } catch (e) { console.log('sku already exists or error:', e.message); }

        try {
            await qi.addColumn('Products', 'variantId', {
                type: require('sequelize').DataTypes.INTEGER,
                allowNull: true,
            });
            console.log('Added: variantId');
        } catch (e) { console.log('variantId already exists or error:', e.message); }

        try {
            await qi.addColumn('Products', 'defaultVariant', {
                type: require('sequelize').DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            });
            console.log('Added: defaultVariant');
        } catch (e) { console.log('defaultVariant already exists or error:', e.message); }

        // Remove old column
        try {
            await qi.removeColumn('Products', 'variantGroupId');
            console.log('Removed: variantGroupId');
        } catch (e) { console.log('variantGroupId not found or error:', e.message); }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

run();
