import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../config/db.js';
import { createMemberSchema, updateMemberSchema } from '../validators/schemas.js';
import { createAuditLog } from '../utils/auditLogger.js';

// Helper to generate next sequential Member ID
async function generateMemberId(conn: any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `MEM-${currentYear}-`;
  const [rows]: any = await conn.query(
    `SELECT member_id FROM member_profiles WHERE member_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastId = rows[0].member_id;
    const parts = lastId.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function getMembers(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      status,
      role,
      rankId,
      zoneId,
      sectorId,
      beatId,
      startDate,
      endDate,
      page = '1',
      limit = '10',
      sortBy = 'id',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ['mp.archived_at IS NULL'];
    const params: any[] = [];

    // Role-based visibility scoping
    if (req.user?.role === 'User') {
      // Regular user can only view their own member profile
      conditions.push('u.id = ?');
      params.push(req.user.id);
    }

    if (search) {
      const searchVal = `%${String(search).trim()}%`;
      conditions.push('(mp.cnic LIKE ? OR mp.name LIKE ? OR mp.member_id LIKE ? OR mp.contact LIKE ?)');
      params.push(searchVal, searchVal, searchVal, searchVal);
    }

    if (status && (status === 'Active' || status === 'Disable')) {
      conditions.push('mp.membership_status = ?');
      params.push(status);
    }

    if (role && (role === 'Super Admin' || role === 'Focal Person' || role === 'User')) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (rankId) {
      conditions.push('mp.rank_id = ?');
      params.push(parseInt(rankId as string, 10));
    }

    if (zoneId) {
      conditions.push('mp.zone_id = ?');
      params.push(parseInt(zoneId as string, 10));
    }

    if (sectorId) {
      conditions.push('mp.sector_id = ?');
      params.push(parseInt(sectorId as string, 10));
    }

    if (beatId) {
      conditions.push('mp.beat_id = ?');
      params.push(parseInt(beatId as string, 10));
    }

    if (startDate) {
      conditions.push('mp.membership_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('mp.membership_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM member_profiles mp
      JOIN users u ON u.id = mp.user_id
      ${whereClause}
    `;
    const countResult = await query<any[]>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Allowed sort columns to prevent SQL injection
    const allowedSortCols: Record<string, string> = {
      id: 'mp.id',
      memberId: 'mp.member_id',
      name: 'mp.name',
      cnic: 'mp.cnic',
      rank: 'mp.rank_name',
      zone: 'mp.zone_name',
      membershipDate: 'mp.membership_date',
      status: 'mp.membership_status',
      role: 'u.role',
      createdAt: 'mp.created_at',
    };

    const sortCol = allowedSortCols[sortBy as string] || 'mp.id';
    const sortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT mp.id, mp.member_id, mp.cnic, mp.name, mp.father_name,
             mp.rank_id, mp.rank_name, mp.posting, mp.address,
             mp.zone_id, mp.zone_name, mp.sector_id, mp.sector_name,
             mp.beat_id, mp.beat_name, mp.contact, mp.date_of_birth,
             mp.membership_date, mp.membership_status, mp.created_at,
             u.id AS user_id, u.role AS account_role, u.status AS account_status
      FROM member_profiles mp
      JOIN users u ON u.id = mp.user_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const members = await query<any[]>(dataQuery, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: members.map((m) => ({
        ...m,
        date_of_birth: m.date_of_birth ? (m.date_of_birth.toISOString?.().split('T')[0] || m.date_of_birth) : null,
        membership_date: m.membership_date ? (m.membership_date.toISOString?.().split('T')[0] || m.membership_date) : null,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getMembers error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve members' });
  }
}

export async function getMemberById(req: Request, res: Response): Promise<void> {
  try {
    const memberIdParam = req.params.id;

    let memberQuery = `
      SELECT mp.*, u.id AS user_id, u.role AS account_role, u.status AS account_status,
             cb.cnic AS created_by_cnic,
             ub.cnic AS updated_by_cnic
      FROM member_profiles mp
      JOIN users u ON u.id = mp.user_id
      LEFT JOIN users cb ON cb.id = mp.created_by
      LEFT JOIN users ub ON ub.id = mp.updated_by
      WHERE (mp.id = ? OR mp.member_id = ? OR mp.cnic = ?) AND mp.archived_at IS NULL
    `;

    const members = await query<any[]>(memberQuery, [memberIdParam, memberIdParam, memberIdParam]);

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member profile not found' });
      return;
    }

    const member = members[0];

    // Regular users can only access their own profile
    if (req.user?.role === 'User' && req.user.id !== member.user_id) {
      res.status(403).json({ success: false, message: 'Access denied to this member profile' });
      return;
    }

    // Fetch quick summary stats for this member
    const [paymentsSum] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_payments, COUNT(*) AS count_payments 
       FROM payments WHERE member_id = ? AND status = 'Posted'`,
      [member.id]
    );

    const [welfareSum] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_welfare, COUNT(*) AS count_welfare 
       FROM welfare_support WHERE member_id = ? AND status = 'Posted'`,
      [member.id]
    );

    const [transfersSent] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_sent, COUNT(*) AS count_sent 
       FROM fund_transfers WHERE sender_id = ? AND status = 'Posted'`,
      [member.id]
    );

    const [transfersReceived] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_received, COUNT(*) AS count_received 
       FROM fund_transfers WHERE receiver_id = ? AND status = 'Posted'`,
      [member.id]
    );

    // Format dates
    member.date_of_birth = member.date_of_birth
      ? member.date_of_birth.toISOString?.().split('T')[0] || member.date_of_birth
      : null;
    member.membership_date = member.membership_date
      ? member.membership_date.toISOString?.().split('T')[0] || member.membership_date
      : null;

    res.json({
      success: true,
      member,
      summary: {
        totalPayments: Number(paymentsSum?.total_payments || 0),
        countPayments: Number(paymentsSum?.count_payments || 0),
        totalWelfare: Number(welfareSum?.total_welfare || 0),
        countWelfare: Number(welfareSum?.count_welfare || 0),
        totalTransfersSent: Number(transfersSent?.total_sent || 0),
        countTransfersSent: Number(transfersSent?.count_sent || 0),
        totalTransfersReceived: Number(transfersReceived?.total_received || 0),
        countTransfersReceived: Number(transfersReceived?.count_received || 0),
      },
    });
  } catch (error) {
    console.error('getMemberById error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve member details' });
  }
}

export async function createMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const parseResult = createMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const data = parseResult.data;

    // Strict Role Enforcement:
    // Focal Persons can ONLY register regular 'User' members.
    // If a Focal Person supplies another role, reject or force to 'User'.
    if (req.user.role === 'Focal Person') {
      if (req.body.accountRole && req.body.accountRole !== 'User') {
        res.status(403).json({
          success: false,
          message: 'Focal Persons are not authorized to assign roles. New members are created with role "User".',
        });
        return;
      }
      data.accountRole = 'User';
    }

    // Check for duplicate CNIC in users and member_profiles
    const existing = await query<any[]>(`SELECT id FROM users WHERE cnic = ?`, [data.cnic]);
    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'A member or user account with this CNIC already exists.',
      });
      return;
    }

    // Password generation: if not supplied, default to temporary password based on CNIC or standard
    const rawPassword = data.password || 'Welcome123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const result = await withTransaction(async (conn) => {
      // 1. Create user account
      const [userResult]: any = await conn.query(
        `INSERT INTO users (cnic, password_hash, role, status, must_change_password)
         VALUES (?, ?, ?, ?, ?)`,
        [data.cnic, passwordHash, data.accountRole, data.status, data.password ? 0 : 1]
      );
      const newUserId = userResult.insertId;

      // 2. Generate sequential Member ID
      const newMemberId = await generateMemberId(conn);

      // 3. Create member profile
      const [profileResult]: any = await conn.query(
        `INSERT INTO member_profiles 
          (user_id, member_id, cnic, name, father_name, rank_id, rank_name, posting,
           address, zone_id, zone_name, sector_id, sector_name, beat_id, beat_name,
           contact, date_of_birth, membership_date, membership_status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newUserId,
          newMemberId,
          data.cnic,
          data.name,
          data.fatherName,
          data.rankId || null,
          data.rankName,
          data.posting,
          data.address,
          data.zoneId || null,
          data.zoneName,
          data.sectorId || null,
          data.sectorName,
          data.beatId || null,
          data.beatName,
          data.contact,
          data.dateOfBirth,
          data.membershipDate,
          data.status,
          req.user!.id,
        ]
      );

      const newProfileId = profileResult.insertId;

      // 4. Initial status history
      await conn.query(
        `INSERT INTO membership_status_history (member_id, previous_status, new_status, changed_by, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [newProfileId, data.status, data.status, req.user!.id, 'Initial registration']
      );

      return { newUserId, newProfileId, newMemberId };
    });

    // Write audit log
    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_MEMBER',
      entityType: 'MEMBER',
      entityId: result.newProfileId,
      newValue: {
        memberId: result.newMemberId,
        cnic: data.cnic,
        name: data.name,
        role: data.accountRole,
        status: data.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: {
        id: result.newProfileId,
        memberId: result.newMemberId,
        userId: result.newUserId,
        cnic: data.cnic,
        name: data.name,
        role: data.accountRole,
      },
    });
  } catch (error) {
    console.error('createMember error:', error);
    res.status(500).json({ success: false, message: 'Failed to create member' });
  }
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const memberIdParam = req.params.id;

    const existingMembers = await query<any[]>(
      `SELECT mp.*, u.role AS account_role, u.status AS account_status 
       FROM member_profiles mp 
       JOIN users u ON u.id = mp.user_id 
       WHERE mp.id = ? AND mp.archived_at IS NULL`,
      [memberIdParam]
    );

    if (existingMembers.length === 0) {
      res.status(404).json({ success: false, message: 'Member profile not found' });
      return;
    }

    const current = existingMembers[0];

    // Role Enforcement:
    // Focal Persons cannot update account role.
    if (req.user.role === 'Focal Person' && req.body.accountRole !== undefined) {
      res.status(403).json({
        success: false,
        message: 'Focal Persons are not permitted to change account roles.',
      });
      return;
    }

    // Regular users can only update contact information if setting allows
    if (req.user.role === 'User') {
      if (req.user.id !== current.user_id) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
      // Check system setting for allowing contact update
      const settings = await query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'allow_member_contact_update'`
      );
      if (settings.length > 0 && settings[0].setting_value !== '1') {
        res.status(403).json({
          success: false,
          message: 'Contact information updates by members are currently disabled by administration.',
        });
        return;
      }
    }

    const parseResult = updateMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const data = parseResult.data;

    // Check if Super Admin is attempting to demote or disable the last Super Admin
    if (data.accountRole && data.accountRole !== 'Super Admin' && current.account_role === 'Super Admin') {
      const [adminCount]: any = await query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'Super Admin' AND status = 'Active'`
      );
      if (adminCount.total <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot demote the last remaining active Super Admin.',
        });
        return;
      }
    }

    await withTransaction(async (conn) => {
      // Update profile fields
      await conn.query(
        `UPDATE member_profiles SET
          name = COALESCE(?, name),
          father_name = COALESCE(?, father_name),
          rank_id = COALESCE(?, rank_id),
          rank_name = COALESCE(?, rank_name),
          posting = COALESCE(?, posting),
          address = COALESCE(?, address),
          zone_id = COALESCE(?, zone_id),
          zone_name = COALESCE(?, zone_name),
          sector_id = COALESCE(?, sector_id),
          sector_name = COALESCE(?, sector_name),
          beat_id = COALESCE(?, beat_id),
          beat_name = COALESCE(?, beat_name),
          contact = COALESCE(?, contact),
          date_of_birth = COALESCE(?, date_of_birth),
          membership_date = COALESCE(?, membership_date),
          membership_status = COALESCE(?, membership_status),
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          data.name ?? null,
          data.fatherName ?? null,
          data.rankId ?? null,
          data.rankName ?? null,
          data.posting ?? null,
          data.address ?? null,
          data.zoneId ?? null,
          data.zoneName ?? null,
          data.sectorId ?? null,
          data.sectorName ?? null,
          data.beatId ?? null,
          data.beatName ?? null,
          data.contact ?? null,
          data.dateOfBirth ?? null,
          data.membershipDate ?? null,
          data.status ?? null,
          req.user!.id,
          current.id,
        ]
      );

      // If status changed, record to status history
      if (data.status && data.status !== current.membership_status) {
        await conn.query(
          `INSERT INTO membership_status_history (member_id, previous_status, new_status, changed_by, reason)
           VALUES (?, ?, ?, ?, ?)`,
          [current.id, current.membership_status, data.status, req.user!.id, 'Profile update']
        );

        // Keep user account status synchronized
        await conn.query(`UPDATE users SET status = ? WHERE id = ?`, [data.status, current.user_id]);
      }

      // If Super Admin updated account role
      if (req.user!.role === 'Super Admin' && data.accountRole) {
        await conn.query(`UPDATE users SET role = ? WHERE id = ?`, [data.accountRole, current.user_id]);
      }
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'UPDATE_MEMBER',
      entityType: 'MEMBER',
      entityId: current.id,
      previousValue: current,
      newValue: data,
      req,
    });

    res.json({ success: true, message: 'Member profile updated successfully' });
  } catch (error) {
    console.error('updateMember error:', error);
    res.status(500).json({ success: false, message: 'Failed to update member' });
  }
}

export async function updateMemberStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (status !== 'Active' && status !== 'Disable') {
      res.status(400).json({ success: false, message: 'Status must be Active or Disable' });
      return;
    }

    const members = await query<any[]>(
      `SELECT mp.id, mp.membership_status, mp.user_id, u.role FROM member_profiles mp
       JOIN users u ON u.id = mp.user_id
       WHERE mp.id = ? AND mp.archived_at IS NULL`,
      [id]
    );

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    const member = members[0];

    // Prevent disabling last Super Admin
    if (status === 'Disable' && member.role === 'Super Admin') {
      const [adminCount]: any = await query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'Super Admin' AND status = 'Active'`
      );
      if (adminCount.total <= 1) {
        res.status(400).json({ success: false, message: 'Cannot disable the last active Super Admin.' });
        return;
      }
    }

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE member_profiles SET membership_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [status, req.user!.id, member.id]
      );

      await conn.query(`UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`, [
        status,
        member.user_id,
      ]);

      await conn.query(
        `INSERT INTO membership_status_history (member_id, previous_status, new_status, changed_by, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [member.id, member.membership_status, status, req.user!.id, reason || 'Status modified by administrator']
      );
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'UPDATE_MEMBER_STATUS',
      entityType: 'MEMBER',
      entityId: member.id,
      previousValue: { status: member.membership_status },
      newValue: { status },
      reason,
      req,
    });

    res.json({
      success: true,
      message: `Member status updated to ${status}`,
    });
  } catch (error) {
    console.error('updateMemberStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update member status' });
  }
}

export async function updateMembershipDate(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { membershipDate, reason } = req.body;

    if (!membershipDate || !/^\d{4}-\d{2}-\d{2}$/.test(membershipDate)) {
      res.status(400).json({ success: false, message: 'Valid date in YYYY-MM-DD format is required' });
      return;
    }

    const members = await query<any[]>(
      `SELECT id, membership_date FROM member_profiles WHERE id = ? AND archived_at IS NULL`,
      [id]
    );

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    const prevDate = members[0].membership_date;

    await query(
      `UPDATE member_profiles SET membership_date = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
      [membershipDate, req.user.id, id]
    );

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'UPDATE_MEMBERSHIP_DATE',
      entityType: 'MEMBER',
      entityId: id,
      previousValue: { membershipDate: prevDate },
      newValue: { membershipDate },
      reason,
      req,
    });

    res.json({ success: true, message: 'Membership date updated successfully' });
  } catch (error) {
    console.error('updateMembershipDate error:', error);
    res.status(500).json({ success: false, message: 'Failed to update membership date' });
  }
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  try {
    // Super Admin only endpoint
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Only Super Admin can change account roles.' });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['Super Admin', 'Focal Person', 'User'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified.' });
      return;
    }

    const members = await query<any[]>(
      `SELECT mp.id, mp.user_id, u.role FROM member_profiles mp
       JOIN users u ON u.id = mp.user_id
       WHERE mp.id = ? AND mp.archived_at IS NULL`,
      [id]
    );

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    const member = members[0];

    // Check preventing removal/demotion of last active Super Admin
    if (member.role === 'Super Admin' && role !== 'Super Admin') {
      const [adminCount]: any = await query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'Super Admin' AND status = 'Active'`
      );
      if (adminCount.total <= 1) {
        res.status(400).json({ success: false, message: 'Cannot demote the last remaining active Super Admin.' });
        return;
      }
    }

    await query(`UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`, [role, member.user_id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'UPDATE_ACCOUNT_ROLE',
      entityType: 'USER',
      entityId: member.user_id,
      previousValue: { role: member.role },
      newValue: { role },
      req,
    });

    res.json({ success: true, message: `Account role updated to ${role}` });
  } catch (error) {
    console.error('updateMemberRole error:', error);
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
}

export async function archiveMember(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Only Super Admin can archive member records.' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const members = await query<any[]>(
      `SELECT mp.id, mp.user_id, u.role FROM member_profiles mp
       JOIN users u ON u.id = mp.user_id
       WHERE mp.id = ? AND mp.archived_at IS NULL`,
      [id]
    );

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    const member = members[0];

    // Prevent archiving last Super Admin
    if (member.role === 'Super Admin') {
      const [adminCount]: any = await query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'Super Admin' AND status = 'Active'`
      );
      if (adminCount.total <= 1) {
        res.status(400).json({ success: false, message: 'Cannot archive the last active Super Admin.' });
        return;
      }
    }

    // Guarded archival: set archived_at on profile and disable user
    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE member_profiles SET archived_at = NOW(), membership_status = 'Disable', updated_by = ? WHERE id = ?`,
        [req.user!.id, member.id]
      );
      await conn.query(`UPDATE users SET status = 'Disable' WHERE id = ?`, [member.user_id]);
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'ARCHIVE_MEMBER',
      entityType: 'MEMBER',
      entityId: member.id,
      reason,
      req,
    });

    res.json({ success: true, message: 'Member record successfully archived' });
  } catch (error) {
    console.error('archiveMember error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive member' });
  }
}
