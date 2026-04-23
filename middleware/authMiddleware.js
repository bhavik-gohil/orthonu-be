const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

async function authMiddleware(req, res, next) {
    let token = null;

    // Check Authorization header first (legacy support)
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
    }

    // Check cookies if no header found
    const cookies = req.cookies || {};

    // ── Try admin token ────────────────────────────────────────────────────────
    if (cookies.admin_token) {
        try {
            const payload = jwt.verify(cookies.admin_token, process.env.JWT_SECRET);

            // Single-device enforcement: verify the session token matches the DB record
            const adminRecord = await AdminUser.findOne({
                where: { id: payload.id },
                attributes: ['id', 'sessionToken'],
            });

            if (!adminRecord) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            if (adminRecord.sessionToken !== payload.sessionToken) {
                // Session was invalidated (logout from another device or account takeover)
                return res.status(401).json({
                    message: 'Session expired. Please log in again.',
                });
            }

            req.adminUser = payload;
            return next();
        } catch (err) {
            // Invalid admin token, continue to check user token
        }
    }

    // ── Try user token (no device restriction for regular users) ──────────────
    if (cookies.user_token) {
        try {
            const payload = jwt.verify(cookies.user_token, process.env.JWT_SECRET);
            req.user = payload;
            return next();
        } catch (err) {
            // Invalid user token
        }
    }

    // ── Fallback to Bearer token ───────────────────────────────────────────────
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const { ADMIN_USER_TYPES } = require('../utils/constants');
            if (Object.values(ADMIN_USER_TYPES).includes(payload.userType)) {
                req.adminUser = payload;
            } else {
                req.user = payload;
            }
            return next();
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }

    return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = authMiddleware;
