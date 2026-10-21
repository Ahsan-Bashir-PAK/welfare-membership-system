"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const db_js_1 = require("../config/db.js");
async function createAuditLog(options) {
    try {
        const ipAddress = options.req
            ? options.req.headers['x-forwarded-for'] || options.req.socket.remoteAddress || null
            : null;
        const userAgent = options.req ? options.req.headers['user-agent'] || null : null;
        const prevJson = options.previousValue !== undefined ? JSON.stringify(options.previousValue) : null;
        const newJson = options.newValue !== undefined ? JSON.stringify(options.newValue) : null;
        await (0, db_js_1.query)(`INSERT INTO audit_logs 
        (actor_id, actor_role, action_type, entity_type, entity_id, previous_value, new_value, reason, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            options.actorId,
            options.actorRole,
            options.actionType,
            options.entityType,
            String(options.entityId),
            prevJson,
            newJson,
            options.reason || null,
            ipAddress,
            userAgent,
        ]);
    }
    catch (error) {
        // Non-blocking error logging for audit logs to preserve main transaction flow
        console.error('Failed to write audit log:', error);
    }
}
