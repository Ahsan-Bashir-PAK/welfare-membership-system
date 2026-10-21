import type { Request, Response } from 'express';
import { query } from '../config/db.js';
import { createAuditLog } from '../utils/auditLogger.js';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await query<any[]>(`SELECT id, setting_key, setting_value, description, updated_at FROM system_settings`);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('getSettings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve settings' });
  }
}

export async function updateSetting(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ success: false, message: 'Setting value is required' });
      return;
    }

    const existing = await query<any[]>(`SELECT setting_value FROM system_settings WHERE setting_key = ?`, [key]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Setting key not found' });
      return;
    }

    const previousValue = existing[0].setting_value;

    await query(
      `UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?`,
      [String(value), req.user.id, key]
    );

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'UPDATE_SETTING',
      entityType: 'SYSTEM_SETTING',
      entityId: key,
      previousValue: { value: previousValue },
      newValue: { value },
      req,
    });

    res.json({ success: true, message: `Setting '${key}' updated successfully` });
  } catch (error) {
    console.error('updateSetting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
}
