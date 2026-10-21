"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getMe = getMe;
exports.verifyForgotPassword = verifyForgotPassword;
exports.resetForgotPassword = resetForgotPassword;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../config/db.js");
const env_js_1 = require("../config/env.js");
const schemas_js_1 = require("../validators/schemas.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
async function login(req, res) {
    try {
        const parseResult = schemas_js_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Validation error',
            });
            return;
        }
        const { cnic, password } = parseResult.data;
        const users = await (0, db_js_1.query)(`SELECT u.id, u.cnic, u.password_hash, u.role, u.status, u.must_change_password,
              mp.id AS member_profile_id, mp.member_id, mp.name, mp.membership_status, mp.rank_name
       FROM users u
       LEFT JOIN member_profiles mp ON mp.user_id = u.id AND mp.archived_at IS NULL
       WHERE u.cnic = ?`, [cnic]);
        if (users.length === 0) {
            res.status(401).json({ success: false, message: 'Invalid CNIC or password.' });
            return;
        }
        const user = users[0];
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ success: false, message: 'Invalid CNIC or password.' });
            return;
        }
        // Check account status
        if (user.status !== 'Active') {
            res.status(403).json({
                success: false,
                message: 'Your account is disabled. Please contact the administrator.',
            });
            return;
        }
        // Check membership status policy for regular users
        if (user.role === 'User' && user.membership_status === 'Disable') {
            res.status(403).json({
                success: false,
                message: 'Your membership is currently disabled. Access restricted.',
            });
            return;
        }
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            cnic: user.cnic,
            role: user.role,
        }, env_js_1.config.jwt.secret, { expiresIn: '24h' });
        // Set secure HTTP-only cookie
        res.cookie(env_js_1.config.cookieName, token, {
            httpOnly: true,
            secure: env_js_1.config.isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        // Write audit log
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: user.id,
            actorRole: user.role,
            actionType: 'LOGIN',
            entityType: 'USER',
            entityId: user.id,
            req,
        });
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                cnic: user.cnic,
                role: user.role,
                status: user.status,
                name: user.name || (user.role === 'Super Admin' ? 'Super Administrator' : 'User'),
                memberId: user.member_id || null,
                memberProfileId: user.member_profile_id || null,
                membershipStatus: user.membership_status || null,
                rankName: user.rank_name || null,
                mustChangePassword: Boolean(user.must_change_password),
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
}
async function logout(req, res) {
    try {
        if (req.user) {
            await (0, auditLogger_js_1.createAuditLog)({
                actorId: req.user.id,
                actorRole: req.user.role,
                actionType: 'LOGOUT',
                entityType: 'USER',
                entityId: req.user.id,
                req,
            });
        }
        res.clearCookie(env_js_1.config.cookieName, {
            httpOnly: true,
            secure: env_js_1.config.isProduction,
            sameSite: 'lax',
        });
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during logout' });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const users = await (0, db_js_1.query)(`SELECT u.id, u.cnic, u.role, u.status, u.created_at,
              mp.id AS member_profile_id, mp.member_id, mp.name, mp.father_name,
              mp.rank_name, mp.posting, mp.address, mp.zone_name, mp.sector_name,
              mp.beat_name, mp.contact, mp.date_of_birth, mp.membership_date,
              mp.membership_status
       FROM users u
       LEFT JOIN member_profiles mp ON mp.user_id = u.id AND mp.archived_at IS NULL
       WHERE u.id = ?`, [req.user.id]);
        if (users.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                cnic: user.cnic,
                role: user.role,
                status: user.status,
                name: user.name || (user.role === 'Super Admin' ? 'Super Administrator' : 'User'),
                memberId: user.member_id || null,
                memberProfileId: user.member_profile_id || null,
                membershipStatus: user.membership_status || null,
                fatherName: user.father_name || null,
                rankName: user.rank_name || null,
                posting: user.posting || null,
                address: user.address || null,
                zoneName: user.zone_name || null,
                sectorName: user.sector_name || null,
                beatName: user.beat_name || null,
                contact: user.contact || null,
                dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString?.().split('T')[0] || user.date_of_birth : null,
                membershipDate: user.membership_date ? user.membership_date.toISOString?.().split('T')[0] || user.membership_date : null,
                createdAt: user.created_at,
            },
        });
    }
    catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve current user profile' });
    }
}
async function verifyForgotPassword(req, res) {
    try {
        const parseResult = schemas_js_1.forgotPasswordVerifySchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Validation error',
            });
            return;
        }
        const { cnic, dateOfBirth } = parseResult.data;
        const records = await (0, db_js_1.query)(`SELECT u.id, u.cnic, mp.date_of_birth
       FROM users u
       JOIN member_profiles mp ON mp.user_id = u.id AND mp.archived_at IS NULL
       WHERE u.cnic = ?`, [cnic]);
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        let isMatch = false;
        if (records.length > 0) {
            const dbDob = records[0].date_of_birth;
            const formattedDbDob = dbDob instanceof Date ? dbDob.toISOString().split('T')[0] : String(dbDob);
            if (formattedDbDob === dateOfBirth) {
                isMatch = true;
            }
        }
        // Log the verification attempt without exposing passwords
        await (0, db_js_1.query)(`INSERT INTO password_reset_logs (cnic, success, ip_address, user_agent) VALUES (?, ?, ?, ?)`, [cnic, isMatch ? 1 : 0, ipAddress, userAgent]);
        if (!isMatch) {
            // Generic error message to prevent CNIC enumeration
            res.status(400).json({
                success: false,
                message: 'The provided CNIC and Date of Birth do not match our verified records.',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Identity verified successfully. You may proceed to set a new password.',
        });
    }
    catch (error) {
        console.error('verifyForgotPassword error:', error);
        res.status(500).json({ success: false, message: 'Password recovery verification failed' });
    }
}
async function resetForgotPassword(req, res) {
    try {
        const parseResult = schemas_js_1.forgotPasswordResetSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Validation error',
            });
            return;
        }
        const { cnic, dateOfBirth, newPassword } = parseResult.data;
        const records = await (0, db_js_1.query)(`SELECT u.id, u.cnic, u.role, mp.date_of_birth
       FROM users u
       JOIN member_profiles mp ON mp.user_id = u.id AND mp.archived_at IS NULL
       WHERE u.cnic = ?`, [cnic]);
        let isMatch = false;
        let userRecord = null;
        if (records.length > 0) {
            userRecord = records[0];
            const dbDob = userRecord.date_of_birth;
            const formattedDbDob = dbDob instanceof Date ? dbDob.toISOString().split('T')[0] : String(dbDob);
            if (formattedDbDob === dateOfBirth) {
                isMatch = true;
            }
        }
        if (!isMatch || !userRecord) {
            res.status(400).json({
                success: false,
                message: 'Verification failed. CNIC and Date of Birth do not match.',
            });
            return;
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await (0, db_js_1.query)(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ?`, [passwordHash, userRecord.id]);
        // Audit log
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: userRecord.id,
            actorRole: userRecord.role,
            actionType: 'FORGOT_PASSWORD_RESET',
            entityType: 'USER',
            entityId: userRecord.id,
            reason: 'Self-service password recovery via CNIC and Date of Birth',
            req,
        });
        res.json({
            success: true,
            message: 'Your password has been successfully reset. Please log in with your new password.',
        });
    }
    catch (error) {
        console.error('resetForgotPassword error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
}
async function changePassword(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const parseResult = schemas_js_1.changePasswordSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Validation error',
            });
            return;
        }
        const { currentPassword, newPassword } = parseResult.data;
        const users = await (0, db_js_1.query)(`SELECT id, password_hash, role FROM users WHERE id = ?`, [req.user.id]);
        if (users.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const user = users[0];
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password is incorrect' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await (0, db_js_1.query)(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ?`, [passwordHash, req.user.id]);
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: req.user.id,
            actorRole: req.user.role,
            actionType: 'CHANGE_PASSWORD',
            entityType: 'USER',
            entityId: req.user.id,
            reason: 'User initiated password change',
            req,
        });
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
}
