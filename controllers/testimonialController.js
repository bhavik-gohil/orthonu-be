const { Testimonial } = require('../models');

// GET all — public
const getTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({ order: [['createdAt', 'DESC']] });
        res.json(testimonials);
    } catch (err) {
        console.error('getTestimonials error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST create — admin only
const createTestimonial = async (req, res) => {
    try {
        const { text, by, from } = req.body;
        if (!text || !by) {
            return res.status(400).json({ error: '"text" and "by" are required' });
        }
        const testimonial = await Testimonial.create({ text, by, from });
        res.status(201).json(testimonial);
    } catch (err) {
        console.error('createTestimonial error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// DELETE — admin only
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await Testimonial.findByPk(id);
        if (!testimonial) return res.status(404).json({ error: 'Not found' });
        await testimonial.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('deleteTestimonial error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getTestimonials, createTestimonial, deleteTestimonial };
