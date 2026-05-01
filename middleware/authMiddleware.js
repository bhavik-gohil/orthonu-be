const jwt = require('jsonwebtoken');
const { AdminUser, UserSession } = require('../models');
const { SESSION_CONFIG } = require('../utils/constants');

async function authMiddleware(req, res, next) {
    let token = null;

    // Check Authorization header first (legacy support)
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
    }

    // Check cookies if no header found
    const cookies = req.cookies || {};

    let adminAuthError = null;
    let userAuthError = null;

    // ── Try admin token ────────────────────────────────────────────────────────
    if (cookies.admin_token) {
        try {
            const payload = jwt.verify(cookies.admin_token, process.env.JWT_SECRET);
            const sessionRecord = await UserSession.findOne({
                where: { userId: payload.uid, isAdmin: true },
                attributes: ['sessionToken'],
            });

            if (!sessionRecord || sessionRecord.sessionToken !== payload.sessionToken) {
                adminAuthError = { status: 401, payload: { message: 'Session invalid. Please log in again.' } };
            } else {
                await UserSession.update(
                    { updatedAt: new Date() },
                    { where: { userId: payload.uid, isAdmin: true } }
                );
                req.adminUser = payload;
            }
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                try {
                    const payload = jwt.verify(cookies.admin_token, process.env.JWT_SECRET, { ignoreExpiration: true });
                    const sessionRecord = await UserSession.findOne({
                        where: { userId: payload.uid, isAdmin: true },
                        attributes: ['updatedAt']
                    });

                    if (sessionRecord) {
                        const inactivity = Date.now() - sessionRecord.updatedAt.getTime();
                        if (inactivity <= SESSION_CONFIG.ADMIN_GRACE_PERIOD_MS) {
                            adminAuthError = { status: 401, payload: { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED_GRACE' } };
                        } else {
                            adminAuthError = { status: 401, payload: { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED_FINAL' } };
                        }
                    } else {
                        adminAuthError = { status: 401, payload: { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED_FINAL' } };
                    }
                } catch (decodeErr) {
                    adminAuthError = { status: 401, payload: { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED_FINAL' } };
                }
            } else {
                adminAuthError = { status: 401, payload: { message: 'Session invalid. Please log in again.' } };
            }
        }
    }

    // ── Try user token (no device restriction for regular users) ──────────────
    if (cookies.user_token) {
        try {
            const payload = jwt.verify(cookies.user_token, process.env.JWT_SECRET);
            req.user = payload;
        } catch (err) {
            userAuthError = { status: 401, payload: { message: 'Session invalid. Please log in again.' } };
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
        } catch (err) {
            // Ignore Bearer error, fall back to default behavior
        }
    }

    // ── Final Decision Logic ───────────────────────────────────────────────────
    const isAdminRoute = req.originalUrl.includes('/admin');

    if (isAdminRoute) {
        if (req.adminUser) return next();
        if (adminAuthError) return res.status(adminAuthError.status).json(adminAuthError.payload);
        return res.status(401).json({ message: 'Unauthorized' });
    } else {
        if (req.user) return next();
        if (userAuthError) return res.status(userAuthError.status).json(userAuthError.payload);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = authMiddleware;
