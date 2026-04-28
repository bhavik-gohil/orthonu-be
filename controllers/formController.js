const { Form } = require('../models');

/**
 * Submit Contact Form
 * Handles contact form submissions and stores them in the database
 */
const submitContactForm = async (req, res) => {
  try {
    const {
      name,
      email,
      city,
      state,
      phone,
      organization,
      message,
      requestType,
      consentGiven,
      submittedAt
    } = req.body;

    // Validate required fields
    const errors = {};
    
    if (!name || name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!city || city.trim() === '') {
      errors.city = 'City is required';
    }
    
    if (!state || state.trim() === '') {
      errors.state = 'State is required';
    }
    
    if (!phone || phone.trim() === '') {
      errors.phone = 'Phone is required';
    }
    
    if (!organization || organization.trim() === '') {
      errors.organization = 'Organization is required';
    }
    
    if (!message || message.trim() === '') {
      errors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    if (!requestType || requestType.trim() === '') {
      errors.requestType = 'Request type is required';
    }
    
    if (!consentGiven) {
      errors.consentGiven = 'You must agree to be contacted';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Please correct the following errors',
        errors
      });
    }

    // Create form submission record
    const formData = {
      name: 'contact_form',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        state: state.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        message: message.trim(),
        requestType: requestType.trim(),
        consentGiven,
        submittedAt: submittedAt || new Date().toISOString(),
        type: 'contact'
      }
    };

    const form = await Form.create(formData);

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      id: form.id
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

/**
 * Submit Partnership Form
 * Handles partnership form submissions and stores them in the database
 */
const submitPartnershipForm = async (req, res) => {
  try {
    const {
      name,
      organization,
      workEmail,
      numberOfLocations,
      needs,
      submittedAt
    } = req.body;

    // Validate required fields
    const errors = {};
    
    if (!name || name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (!organization || organization.trim() === '') {
      errors.organization = 'Organization is required';
    }
    
    if (!workEmail || workEmail.trim() === '') {
      errors.workEmail = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
      errors.workEmail = 'Please enter a valid work email address';
    }
    
    if (!numberOfLocations || numberOfLocations <= 0) {
      errors.numberOfLocations = 'Number of locations is required and must be greater than 0';
    }
    
    if (!needs || needs.trim() === '') {
      errors.needs = 'Please tell us about your needs';
    } else if (needs.trim().length < 10) {
      errors.needs = 'Please tell us more about your needs (minimum 10 characters)';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Please correct the following errors',
        errors
      });
    }

    // Create form submission record
    const formData = {
      name: 'partnership_form',
      data: {
        name: name.trim(),
        organization: organization.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        numberOfLocations: parseInt(numberOfLocations),
        needs: needs.trim(),
        submittedAt: submittedAt || new Date().toISOString(),
        type: 'partnership'
      }
    };

    const form = await Form.create(formData);

    res.status(201).json({
      success: true,
      message: 'Partnership form submitted successfully',
      id: form.id
    });

  } catch (error) {
    console.error('Partnership form submission error:', error);
    res.status(500).json({
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

/**
 * Get all form submissions (admin only)
 * Returns paginated list of form submissions
 */
const getAllForms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type; // 'contact' or 'partnership'

    const whereClause = {};
    if (type) {
      whereClause['data.type'] = type;
    }

    const { count, rows } = await Form.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      forms: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({
      message: 'An error occurred while fetching forms'
    });
  }
};

/**
 * Get single form submission by ID (admin only)
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const form = await Form.findByPk(id);
    
    if (!form) {
      return res.status(404).json({
        message: 'Form submission not found'
      });
    }

    res.json(form);

  } catch (error) {
    console.error('Get form by ID error:', error);
    res.status(500).json({
      message: 'An error occurred while fetching the form'
    });
  }
};

/**
 * Submit White Paper Download Form
 */
const submitWhitePaperForm = async (req, res) => {
  try {
    const { firstName, lastName, email, submittedAt } = req.body;

    const errors = {};
    if (!firstName || !firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName || !lastName.trim()) errors.lastName = 'Last name is required';
    if (!email || !email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Please correct the following errors', errors });
    }

    const form = await Form.create({
      name: 'white_paper_download',
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        submittedAt: submittedAt || new Date().toISOString(),
        type: 'white_paper_download',
      },
    });

    res.status(201).json({ success: true, message: 'Thank you! Your download is ready.', id: form.id });
  } catch (error) {
    console.error('White paper form error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

/**
 * Submit Pilot Request Form
 */
const submitPilotRequestForm = async (req, res) => {
  try {
    const { name, practiceName, numberOfLocations, email, submittedAt } = req.body;

    const errors = {};
    if (!name || !name.trim()) errors.name = 'Name is required';
    if (!practiceName || !practiceName.trim()) errors.practiceName = 'Practice name is required';
    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (numberOfLocations === undefined || numberOfLocations === null || numberOfLocations === '') {
      errors.numberOfLocations = 'Number of locations is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Please correct the following errors', errors });
    }

    const form = await Form.create({
      name: 'request_pilot',
      data: {
        name: name.trim(),
        practiceName: practiceName.trim(),
        numberOfLocations: parseInt(numberOfLocations),
        email: email.trim().toLowerCase(),
        submittedAt: submittedAt || new Date().toISOString(),
        type: 'request_pilot',
      },
    });

    res.status(201).json({ 
      success: true, 
      message: "We'll reach out within 24 hours. — Sima, sima@orthonu.com", 
      id: form.id 
    });
  } catch (error) {
    console.error('Pilot request form error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

module.exports = {
  submitContactForm,
  submitPartnershipForm,
  submitWhitePaperForm,
  submitPilotRequestForm,
  getAllForms,
  getFormById,
};