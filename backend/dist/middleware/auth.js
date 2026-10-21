"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const db_js_1 = require("../config/db.js");
async function authenticateToken(req, res, next) {
    try {
        let token = req.cookies?.[env_js_1.config.cookieName];
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwt.secret);
        }
        catch (err) {
            res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
            return;
        }
        // Always fetch fresh state from database to verify active status
        const users = await (0, db_js_1.query)(`SELECT u.id, u.cnic, u.role, u.status,
              mp.id AS member_profile_id, mp.member_id, mp.name, mp.membership_status
       FROM users u
       LEFT JOIN member_profiles mp ON mp.user_id = u.id AND mp.archived_at IS NULL
       WHERE u.id = ?`, [decoded.userId]);
        if (users.length === 0) {
            res.status(401).json({ success: false, message: 'User account not found.' });
            return;
        }
        const user = users[0];
        if (user.status !== 'Active') {
            res.status(403).json({ success: false, message: 'Account is disabled. Please contact the administrator.' });
            return;
        }
        req.user = {
            id: user.id,
            cnic: user.cnic,
            role: user.role,
            status: user.status,
            memberProfileId: user.member_profile_id || undefined,
            memberId: user.member_id || undefined,
            name: user.name || (user.role === 'Super Admin' ? 'Super Administrator' : 'User'),
            membershipStatus: user.membership_status || undefined,
        };
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({ success: false, message: 'Internal server authentication error' });
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden. Role '${req.user.role}' is not authorized to perform this operation.`,
            });
            return;
        }
        next();
    };
}
