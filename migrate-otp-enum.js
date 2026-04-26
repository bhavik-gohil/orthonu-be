require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./models');

async function migrate() {
    try {
        console.log("Starting migration to remove ENUM from Otps.type...");
        
        // 1. Alter the column type to VARCHAR
        await sequelize.query('ALTER TABLE "Otps" ALTER COLUMN "type" TYPE VARCHAR(255);');
        console.log("Column type altered to VARCHAR.");
        
        // 2. Drop the enum type if it exists
        // Sequelize usually names it "enum_Otps_type"
        try {
            await sequelize.query('DROP TYPE IF EXISTS "enum_Otps_type";');
            console.log("Enum type dropped.");
        } catch (e) {
            console.log("Could not drop enum type (it might have a different name or is already gone):", e.message);
        }
        
        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
