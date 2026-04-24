const { Partner } = require('../models');

const partners = [
  {
    name: "Mari’s List",
    description: "Founded in 2012, Mari’s List is the largest Orthodontist-exclusive buying group in the nation with 2,700 members and 165 vendor partners. Mari’s List carefully selects companies with the highest product quality and customer service, then uses collective buying power to negotiate discounted pricing. Members simply pay a low annual fee for access to these negotiations as well as a dynamic member forum.",
    learnMoreUrl: "https://marislist.com",
    logo: "/uploads/seeders/maris-list-logo.png"
  },
  {
    name: "G & H Orthodontics",
    description: "G&H Orthodontics, Inc. is a leading provider of clinical solutions for the orthodontic community serving customers in 87 countries. With 99.9% customer satisfaction for archwires and brackets, G&H is the best manufacturer of a full line orthodontic products made in the USA including wire products, brackets, bands, and tubes, elastomerics and other orthodontic supplies.",
    learnMoreUrl: "https://www.ghorthodontics.com",
    logo: "/uploads/seeders/gh-logo.jpg"
  },
  {
    name: "Sage Dental",
    description: "With locations in FL, GA, TN, and AL, Sage Dental is committed to helping patients stay healthy inside and out. From general and cosmetic dentistry to orthodontics, teeth cleanings, dental implants, dentures, and oral surgery, they are utilizing the latest clinical technology to provide the most affordable dental care all in one place.",
    learnMoreUrl: "https://mysagedental.com",
    logo: "/uploads/seeders/sage-dental-logo.png"
  },
  {
    name: "Young Innovations",
    description: "Young is dedicated to strengthening the dental community by empowering clinicians to practice at the top of their license; improving the health and well-being of our customers, partners and team; and inspiring action across the oral healthcare industry.",
    learnMoreUrl: "https://younginnovations.com/",
    logo: "/uploads/seeders/young-logo.jpg"
  }
];

async function seedPartners() {
  try {
    for (const partner of partners) {
      await Partner.findOrCreate({
        where: { name: partner.name },
        defaults: partner
      });
    }
    console.log('Partners seeded successfully.');
  } catch (err) {
    console.error('Error seeding partners:', err);
  }
}

module.exports = seedPartners;
