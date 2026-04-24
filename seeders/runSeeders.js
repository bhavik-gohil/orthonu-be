const seedBoardMembers = require('./seedBoardMembers');
const seedPartners = require('./seedPartners');
const seedTestimonials = require('./seedTestimonials');
const downloadImages = require('../scripts/downloadSeederImages');

async function runAllSeeders() {
  console.log('Starting seeder execution...');
  console.log('Downloading images first...');
  await downloadImages();
  await seedBoardMembers();
  await seedPartners();
  await seedTestimonials();
  console.log('All seeders executed.');
  process.exit(0);
}

runAllSeeders();
