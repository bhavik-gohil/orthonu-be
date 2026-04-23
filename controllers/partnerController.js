const fs = require('fs');
const path = require('path');
const { Partner } = require('../models');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// GET all — public
const getPartners = async (req, res) => {
    try {
        const partners = await Partner.findAll({ order: [['createdAt', 'ASC']] });
        res.json(partners);
    } catch (err) {
        console.error('getPartners error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST create — admin only (multipart: logo upload)
const createPartner = async (req, res) => {
    try {
        const { name, description, learnMoreUrl } = req.body;
        if (!name || !description) {
            return res.status(400).json({ error: '"name" and "description" are required' });
        }

        let logoPath = null;
        if (req.file) {
            if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            const filename = `partner-${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
            fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
            logoPath = `/uploads/${filename}`;
        }

        const partner = await Partner.create({ name, description, logo: logoPath, learnMoreUrl: learnMoreUrl || null });
        res.status(201).json(partner);
    } catch (err) {
        console.error('createPartner error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// DELETE — admin only
const deletePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await Partner.findByPk(id);
        if (!partner) return res.status(404).json({ error: 'Not found' });

        if (partner.logo) {
            const filePath = path.join(__dirname, '../public', partner.logo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await partner.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('deletePartner error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getPartners, createPartner, deletePartner };
