const jwt = require('jsonwebtoken');
const { AdminUser, UserSession } = require('../models');

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

            // Verify the session token matches the DB record
            const sessionRecord = await UserSession.findOne({
                where: { userId: payload.uid, isAdmin: true },
                attributes: ['sessionToken'],
            });

            if (!sessionRecord) {
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }

            if (sessionRecord.sessionToken !== payload.sessionToken) {
                // Session was invalidated (logout from another device or account takeover)
                return res.status(401).json({
                    message: 'Session invalid. Please log in again.',
                });
            }

            // Update session timestamp to slide the window
            await UserSession.update(
                { updatedAt: new Date() },
                { where: { userId: payload.uid, isAdmin: true } }
            );

            req.adminUser = payload;
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED' });
            }
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
