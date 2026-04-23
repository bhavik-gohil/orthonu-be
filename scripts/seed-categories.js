const { ProductCategory, sequelize } = require('../models');

async function seedCategories() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected.');

    const categories = ['Detect', 'Prevent', 'Heal'];
    
    for (const cat of categories) {
      const [category, created] = await ProductCategory.findOrCreate({
        where: { productCategory: cat },
        defaults: { productCategory: cat }
      });
      
      if (created) {
        console.log(`✓ Created category: ${cat}`);
      } else {
        console.log(`- Category already exists: ${cat}`);
      }
    }

    console.log('\n✓ Seeding complete!');
    console.log(`Total categories: ${categories.length}`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
