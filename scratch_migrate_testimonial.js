const { sequelize } = require('./models');

async function migrate() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Testimonials');
        
        if (!tableInfo.from) {
            console.log('Adding "from" column to Testimonials table...');
            const { DataTypes } = require('sequelize');
            await queryInterface.addColumn('Testimonials', 'from', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('Column added successfully.');
        } else {
            console.log('Column "from" already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
