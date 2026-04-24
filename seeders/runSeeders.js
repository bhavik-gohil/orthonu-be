const seedBoardMembers = require('./seedBoardMembers');
const seedPartners = require('./seedPartners');
const seedTestimonials = require('./seedTestimonials');

async function runAllSeeders() {
  console.log('Starting seeder execution...');
  await seedBoardMembers();
  await seedPartners();
  await seedTestimonials();
  console.log('All seeders executed.');
  process.exit(0);
}

runAllSeeders();
