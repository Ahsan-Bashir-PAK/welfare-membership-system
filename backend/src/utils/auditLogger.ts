import { query } from '../config/db.js';
import type { Request } from 'express';

export interface AuditLogOptions {
  actorId: number;
  actorRole: 'Super Admin' | 'Focal Person' | 'User';
  actionType: string;
  entityType: string;
  entityId: string | number;
  previousValue?: any;
  newValue?: any;
  reason?: string | null;
  req?: Request;
}

export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    const ipAddress = options.req
      ? (options.req.headers['x-forwarded-for'] as string) || options.req.socket.remoteAddress || null
      : null;
    const userAgent = options.req ? options.req.headers['user-agent'] || null : null;

    const prevJson = options.previousValue !== undefined ? JSON.stringify(options.previousValue) : null;
    const newJson = options.newValue !== undefined ? JSON.stringify(options.newValue) : null;

    await query(
      `INSERT INTO audit_logs 
        (actor_id, actor_role, action_type, entity_type, entity_id, previous_value, new_value, reason, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );
  } catch (error) {
    // Non-blocking error logging for audit logs to preserve main transaction flow
    console.error('Failed to write audit log:', error);
  }
}
