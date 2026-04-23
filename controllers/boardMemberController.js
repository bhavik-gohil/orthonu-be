const fs = require('fs');
const path = require('path');
const { BoardMember } = require('../models');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// GET all — public
const getBoardMembers = async (req, res) => {
    try {
        const members = await BoardMember.findAll({ order: [['createdAt', 'ASC']] });
        res.json(members);
    } catch (err) {
        console.error('getBoardMembers error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST create — admin only (multipart: image upload)
const createBoardMember = async (req, res) => {
    try {
        const { name, position } = req.body;
        if (!name || !position) {
            return res.status(400).json({ error: '"name" and "position" are required' });
        }

        let imagePath = null;
        if (req.file) {
            if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            const filename = `board-${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
            fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
            imagePath = `/uploads/${filename}`;
        }

        const member = await BoardMember.create({ name, position, image: imagePath });
        res.status(201).json(member);
    } catch (err) {
        console.error('createBoardMember error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// DELETE — admin only
const deleteBoardMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await BoardMember.findByPk(id);
        if (!member) return res.status(404).json({ error: 'Not found' });

        // Remove image file if exists
        if (member.image) {
            const filePath = path.join(__dirname, '../public', member.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await member.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('deleteBoardMember error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getBoardMembers, createBoardMember, deleteBoardMember };
