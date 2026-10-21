"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = getAuditLogs;
const db_js_1 = require("../config/db.js");
async function getAuditLogs(req, res) {
    try {
        if (!req.user || req.user.role !== 'Super Admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Audit logs are restricted to Super Administrators only.',
            });
            return;
        }
        const { actionType, entityType, actorRole, startDate, endDate, search, page = '1', limit = '20', } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;
        const conditions = [];
        const params = [];
        if (actionType) {
            conditions.push('al.action_type = ?');
            params.push(actionType);
        }
        if (entityType) {
            conditions.push('al.entity_type = ?');
            params.push(entityType);
        }
        if (actorRole) {
            conditions.push('al.actor_role = ?');
            params.push(actorRole);
        }
        if (startDate) {
            conditions.push('al.created_at >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('al.created_at <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (search) {
            const s = `%${String(search).trim()}%`;
            conditions.push('(al.entity_id LIKE ? OR u.cnic LIKE ? OR al.reason LIKE ?)');
            params.push(s, s, s);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await (0, db_js_1.query)(`SELECT COUNT(*) AS total FROM audit_logs al
       JOIN users u ON u.id = al.actor_id
       ${where}`, params);
        const total = countResult[0]?.total || 0;
        const dataQuery = `
      SELECT al.*, u.cnic AS actor_cnic
      FROM audit_logs al
      JOIN users u ON u.id = al.actor_id
      ${where}
      ORDER BY al.id DESC
      LIMIT ? OFFSET ?
    `;
        const logs = await (0, db_js_1.query)(dataQuery, [...params, limitNum, offset]);
        res.json({
            success: true,
            data: logs.map((log) => ({
                ...log,
                previous_value: log.previous_value ? (typeof log.previous_value === 'string' ? JSON.parse(log.previous_value) : log.previous_value) : null,
                new_value: log.new_value ? (typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value) : null,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('getAuditLogs error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
    }
}
