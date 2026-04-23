const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const uploadCategoryImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const file = req.file;
        
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image size must be less than 10MB' });
        }

        // Generate unique filename
        const filename = `category-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Save file
        fs.writeFileSync(filePath, file.buffer);

        // Return path
        const publicPath = `/uploads/${filename}`;
        res.status(200).json({ path: publicPath });

    } catch (err) {
        console.error('Error uploading category image:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = {
    uploadCategoryImage
};
