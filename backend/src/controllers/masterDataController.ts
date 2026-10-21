import type { Request, Response } from 'express';
import { query, withTransaction } from '../config/db.js';
import { createAuditLog } from '../utils/auditLogger.js';

export async function getMasterData(req: Request, res: Response): Promise<void> {
  try {
    const ranks = await query<any[]>(`SELECT id, name, description, is_active FROM ranks WHERE is_active = 1 ORDER BY name ASC`);
    const zones = await query<any[]>(`SELECT id, name, code, is_active FROM zones WHERE is_active = 1 ORDER BY name ASC`);
    const sectors = await query<any[]>(`SELECT id, zone_id, name, code, is_active FROM sectors WHERE is_active = 1 ORDER BY name ASC`);
    const beats = await query<any[]>(`SELECT id, sector_id, name, code, is_active FROM beats WHERE is_active = 1 ORDER BY name ASC`);
    const supportAreas = await query<any[]>(`SELECT id, name, description, is_active FROM support_areas WHERE is_active = 1 ORDER BY name ASC`);

    res.json({
      success: true,
      data: {
        ranks,
        zones,
        sectors,
        beats,
        supportAreas,
      },
    });
  } catch (error) {
    console.error('getMasterData error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve master data' });
  }
}

export async function addRank(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Rank name is required' });
      return;
    }

    const result: any = await query(`INSERT INTO ranks (name, description, is_active) VALUES (?, ?, 1)`, [
      name.trim(),
      description || null,
    ]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_RANK',
      entityType: 'MASTER_DATA',
      entityId: result.insertId,
      newValue: { name, description },
      req,
    });

    res.status(201).json({ success: true, message: 'Rank added successfully' });
  } catch (error) {
    console.error('addRank error:', error);
    res.status(500).json({ success: false, message: 'Failed to add rank' });
  }
}

export async function addZone(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { name, code } = req.body;
    if (!name || !code) {
      res.status(400).json({ success: false, message: 'Zone name and code are required' });
      return;
    }

    const result: any = await query(`INSERT INTO zones (name, code, is_active) VALUES (?, ?, 1)`, [
      name.trim(),
      code.trim(),
    ]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_ZONE',
      entityType: 'MASTER_DATA',
      entityId: result.insertId,
      newValue: { name, code },
      req,
    });

    res.status(201).json({ success: true, message: 'Zone added successfully' });
  } catch (error) {
    console.error('addZone error:', error);
    res.status(500).json({ success: false, message: 'Failed to add zone' });
  }
}

export async function addSector(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { zoneId, name, code } = req.body;
    if (!zoneId || !name || !code) {
      res.status(400).json({ success: false, message: 'Zone ID, sector name, and code are required' });
      return;
    }

    const result: any = await query(`INSERT INTO sectors (zone_id, name, code, is_active) VALUES (?, ?, ?, 1)`, [
      zoneId,
      name.trim(),
      code.trim(),
    ]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_SECTOR',
      entityType: 'MASTER_DATA',
      entityId: result.insertId,
      newValue: { zoneId, name, code },
      req,
    });

    res.status(201).json({ success: true, message: 'Sector added successfully' });
  } catch (error) {
    console.error('addSector error:', error);
    res.status(500).json({ success: false, message: 'Failed to add sector' });
  }
}

export async function addBeat(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { sectorId, name, code } = req.body;
    if (!sectorId || !name || !code) {
      res.status(400).json({ success: false, message: 'Sector ID, beat name, and code are required' });
      return;
    }

    const result: any = await query(`INSERT INTO beats (sector_id, name, code, is_active) VALUES (?, ?, ?, 1)`, [
      sectorId,
      name.trim(),
      code.trim(),
    ]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_BEAT',
      entityType: 'MASTER_DATA',
      entityId: result.insertId,
      newValue: { sectorId, name, code },
      req,
    });

    res.status(201).json({ success: true, message: 'Beat added successfully' });
  } catch (error) {
    console.error('addBeat error:', error);
    res.status(500).json({ success: false, message: 'Failed to add beat' });
  }
}

export async function addSupportArea(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Support Area name is required' });
      return;
    }

    const result: any = await query(`INSERT INTO support_areas (name, description, is_active) VALUES (?, ?, 1)`, [
      name.trim(),
      description || null,
    ]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_SUPPORT_AREA',
      entityType: 'MASTER_DATA',
      entityId: result.insertId,
      newValue: { name, description },
      req,
    });

    res.status(201).json({ success: true, message: 'Support Area added successfully' });
  } catch (error) {
    console.error('addSupportArea error:', error);
    res.status(500).json({ success: false, message: 'Failed to add support area' });
  }
}

export async function deleteRank(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { id } = req.params;
    const existing = await query<any[]>(`SELECT id, name, description FROM ranks WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Rank not found' });
      return;
    }

    await query(`DELETE FROM ranks WHERE id = ?`, [id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'DELETE_RANK',
      entityType: 'MASTER_DATA',
      entityId: id,
      previousValue: existing[0],
      req,
    });

    res.json({ success: true, message: 'Rank deleted successfully' });
  } catch (error) {
    console.error('deleteRank error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete rank' });
  }
}

export async function deleteZone(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { id } = req.params;
    const existing = await query<any[]>(`SELECT id, name, code FROM zones WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }

    await withTransaction(async (conn) => {
      // 1. Delete all beats of all sectors in this zone
      await conn.query(
        `DELETE b FROM beats b INNER JOIN sectors s ON b.sector_id = s.id WHERE s.zone_id = ?`,
        [id]
      );
      // 2. Delete all sectors in this zone
      await conn.query(`DELETE FROM sectors WHERE zone_id = ?`, [id]);
      // 3. Delete the zone itself
      await conn.query(`DELETE FROM zones WHERE id = ?`, [id]);
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'DELETE_ZONE',
      entityType: 'MASTER_DATA',
      entityId: id,
      previousValue: existing[0],
      req,
    });

    res.json({ success: true, message: 'Zone and associated sectors/beats deleted successfully' });
  } catch (error) {
    console.error('deleteZone error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete zone' });
  }
}

export async function deleteSector(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { id } = req.params;
    const existing = await query<any[]>(`SELECT id, name, code, zone_id FROM sectors WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Sector not found' });
      return;
    }

    await withTransaction(async (conn) => {
      // 1. Delete all child beats
      await conn.query(`DELETE FROM beats WHERE sector_id = ?`, [id]);
      // 2. Delete the sector
      await conn.query(`DELETE FROM sectors WHERE id = ?`, [id]);
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'DELETE_SECTOR',
      entityType: 'MASTER_DATA',
      entityId: id,
      previousValue: existing[0],
      req,
    });

    res.json({ success: true, message: 'Sector and associated beats deleted successfully' });
  } catch (error) {
    console.error('deleteSector error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sector' });
  }
}

export async function deleteBeat(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { id } = req.params;
    const existing = await query<any[]>(`SELECT id, name, code, sector_id FROM beats WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Beat not found' });
      return;
    }

    await query(`DELETE FROM beats WHERE id = ?`, [id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'DELETE_BEAT',
      entityType: 'MASTER_DATA',
      entityId: id,
      previousValue: existing[0],
      req,
    });

    res.json({ success: true, message: 'Beat deleted successfully' });
  } catch (error) {
    console.error('deleteBeat error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete beat' });
  }
}

export async function deleteSupportArea(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Super Admin only' });
      return;
    }

    const { id } = req.params;
    const existing = await query<any[]>(`SELECT id, name, description FROM support_areas WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Support Area not found' });
      return;
    }

    await query(`DELETE FROM support_areas WHERE id = ?`, [id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'DELETE_SUPPORT_AREA',
      entityType: 'MASTER_DATA',
      entityId: id,
      previousValue: existing[0],
      req,
    });

    res.json({ success: true, message: 'Welfare assistance category deleted successfully' });
  } catch (error) {
    console.error('deleteSupportArea error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete support area' });
  }
}

