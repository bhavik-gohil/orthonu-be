require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, AdminUser } = require('../models');
const { ADMIN_USER_TYPES } = require('../utils/constants');

const SEED_NAME = process.env.SEED_ADMIN_NAME || 'Main Admin';
const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@orthonu.com';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

async function run() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const existing = await AdminUser.findOne({ where: { userType: ADMIN_USER_TYPES.MAIN_ADMIN } });
        if (existing) {
            console.log(`Main admin already exists: ${existing.email}`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
        const admin = await AdminUser.create({
            name: SEED_NAME,
            email: SEED_EMAIL,
            password: hashedPassword,
            userType: ADMIN_USER_TYPES.MAIN_ADMIN,
            status: 'active',
        });

        console.log(`Main admin created successfully:`);
        console.log(`  Name:  ${admin.name}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  UID:   ${admin.uid}`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to create main admin:', err.message);
        process.exit(1);
    }
}

run();
