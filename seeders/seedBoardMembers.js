const { BoardMember } = require('../models');

const boardMembers = [
  {
    name: "Dr. Jamie Reynold",
    position: "Co-founding Doctor, Orthodontic Partners",
    image: "/uploads/seeders/jamie-reynold.jpeg"
  },
  {
    name: "Dr. Glenn Kreiger",
    position: "Founder, Orthopreneur",
    image: "/uploads/seeders/glenn-kreiger.jpeg"
  },
  {
    name: "Stephanie Cuskley",
    position: "Former CEO of Helmsley Trust, Board Chair Aegion",
    image: "/uploads/seeders/stephanie-cuskley.jpeg"
  },
  {
    name: "Dr. Marc Menkowitz",
    position: "Orthopedic Surgeon",
    image: "/uploads/seeders/placeholder-avatar.jpg"
  },
  {
    name: "Mary Pham",
    position: "Founder & CEO, Lollipop Dentistry & Orthodontics",
    image: "/uploads/seeders/placeholder-avatar.jpg"
  },
  {
    name: "Geoff Freeman",
    position: "Operating Partner at FFL Partners",
    image: "/uploads/seeders/geoffrey-freeman.jpg"
  },
  {
    name: "Scott Derossi, DMD, MBA",
    position: "C-Suite Healthcare Executive, Dental & Medical Clinical Affairs",
    image: "/uploads/seeders/placeholder-avatar.jpg"
  },
  {
    name: "Pat Bauer",
    position: "President & CEO, Heartland Dental",
    image: "/uploads/seeders/placeholder-avatar.jpg"
  },
  {
    name: "Rani Ben-David",
    position: "Founder & CEO, apZme & Sleep Group Solutions",
    image: "/uploads/seeders/placeholder-avatar.jpg"
  }
];

async function seedBoardMembers() {
  try {
    for (const bm of boardMembers) {
      await BoardMember.findOrCreate({
        where: { name: bm.name },
        defaults: bm
      });
    }
    console.log('Board members seeded successfully.');
  } catch (err) {
    console.error('Error seeding board members:', err);
  }
}

module.exports = seedBoardMembers;
