const { ADMIN_USER_TYPES } = require('../utils/constants');

const mainAdminOnly = (req, res, next) => {
    if (!req.adminUser) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.adminUser.userType !== ADMIN_USER_TYPES.MAIN_ADMIN) {
        return res.status(403).json({ message: 'Forbidden: Main Admin access required.' });
    }
    next();
};

// main_admin and editor can manage content (testimonials, board members, partners)
const adminOrEditor = (req, res, next) => {
    if (!req.adminUser) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const allowed = [ADMIN_USER_TYPES.MAIN_ADMIN, ADMIN_USER_TYPES.EDITOR];
    if (!allowed.includes(req.adminUser.userType)) {
        return res.status(403).json({ message: 'Forbidden: Admin or Editor access required.' });
    }
    next();
};

module.exports = { mainAdminOnly, adminOrEditor };
