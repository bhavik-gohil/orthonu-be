const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadDir = path.join(__dirname, '../public/uploads/seeders');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      console.log(`Already exists: ${filename}`);
      return resolve(`/uploads/seeders/${filename}`);
    }

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filename}`);
        resolve(`/uploads/seeders/${filename}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

const images = [
  // Partners
  { url: "https://orthonu.com/wp-content/uploads/2023/06/MLPreferredVendor-300x300.png", name: "maris-list-logo.png" },
  { url: "https://orthonu.com/wp-content/uploads/2025/06/GH-Logo.jpg", name: "gh-logo.jpg" },
  { url: "https://orthonu.com/wp-content/uploads/2025/06/sage-dental-logo-signature.png", name: "sage-dental-logo.png" },
  { url: "https://orthonu.com/wp-content/uploads/2025/06/Young-Logo-2.jpg", name: "young-logo.jpg" },
  
  // Board Members
  { url: "https://orthonu.com/wp-content/uploads/2024/07/jamie-reynold.jpeg", name: "jamie-reynold.jpeg" },
  { url: "https://orthonu.com/wp-content/uploads/2024/07/glenn-kreiger.jpeg", name: "glenn-kreiger.jpeg" },
  { url: "https://orthonu.com/wp-content/uploads/2024/07/stephanie-cuskley-1.jpeg", name: "stephanie-cuskley.jpeg" },
  { url: "https://orthonu.com/wp-content/uploads/2024/07/istockphoto-1288129985-612x612-1.jpg", name: "placeholder-avatar.jpg" }, // Used for multiple
  { url: "https://orthonu.com/wp-content/uploads/2024/07/geoffrey-freeman.jpg", name: "geoffrey-freeman.jpg" }
];

async function run() {
  for (const img of images) {
    try {
      const p = await downloadImage(img.url, img.name);
      console.log(`Path for DB: ${p}`);
    } catch (e) {
      console.error(e);
    }
  }
}

run();
