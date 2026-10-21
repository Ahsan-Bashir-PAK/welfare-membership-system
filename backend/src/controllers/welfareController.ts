import type { Request, Response } from 'express';
import { query, withTransaction } from '../config/db.js';
import { createWelfareSchema, reversalSchema } from '../validators/schemas.js';
import { createAuditLog } from '../utils/auditLogger.js';

async function generateSupportNumber(conn: any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `WLF-${currentYear}-`;
  const [rows]: any = await conn.query(
    `SELECT support_number FROM welfare_support WHERE support_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].support_number;
    const parts = lastNum.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

export async function getWelfareRecords(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      memberId,
      status,
      supportArea,
      paymentMethod,
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

    const conditions: string[] = [];
    const params: any[] = [];

    // Role scoping: regular user can only view their own welfare assistance
    if (req.user?.role === 'User') {
      conditions.push('w.member_id = ?');
      params.push(req.user.memberProfileId || -1);
    }

    if (memberId) {
      conditions.push('w.member_id = ?');
      params.push(parseInt(memberId as string, 10));
    }

    if (search) {
      const s = `%${String(search).trim()}%`;
      conditions.push('(w.support_number LIKE ? OR w.member_cnic LIKE ? OR w.member_name LIKE ? OR w.reference_number LIKE ?)');
      params.push(s, s, s, s);
    }

    if (status && ['Draft', 'Posted', 'Reversed'].includes(status as string)) {
      conditions.push('w.status = ?');
      params.push(status);
    }

    if (supportArea) {
      conditions.push('w.support_area = ?');
      params.push(supportArea);
    }

    if (paymentMethod) {
      conditions.push('w.payment_method = ?');
      params.push(paymentMethod);
    }

    if (startDate) {
      conditions.push('w.payment_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('w.payment_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN w.status = 'Posted' THEN w.amount ELSE 0 END), 0) AS total_amount
       FROM welfare_support w ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;
    const totalAmount = countResult[0]?.total_amount || 0;

    const allowedSortCols: Record<string, string> = {
      id: 'w.id',
      supportNumber: 'w.support_number',
      date: 'w.payment_date',
      amount: 'w.amount',
      area: 'w.support_area',
      status: 'w.status',
      name: 'w.member_name',
      cnic: 'w.member_cnic',
    };
    const sortCol = allowedSortCols[sortBy as string] || 'w.id';
    const sortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT w.*,
             ab.cnic AS added_by_cnic,
             rb.cnic AS reversed_by_cnic
      FROM welfare_support w
      LEFT JOIN users ab ON ab.id = w.added_by
      LEFT JOIN users rb ON rb.id = w.reversed_by
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const records = await query<any[]>(dataQuery, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: records.map((r) => ({
        ...r,
        amount: Number(r.amount),
        payment_date: r.payment_date ? (r.payment_date.toISOString?.().split('T')[0] || r.payment_date) : null,
      })),
      totalAmount: Number(totalAmount),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getWelfareRecords error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve welfare records' });
  }
}

export async function getWelfareById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const records = await query<any[]>(
      `SELECT w.*,
              mp.member_id AS member_code, mp.rank_name, mp.zone_name, mp.contact,
              ab.cnic AS added_by_cnic,
              rb.cnic AS reversed_by_cnic
       FROM welfare_support w
       JOIN member_profiles mp ON mp.id = w.member_id
       LEFT JOIN users ab ON ab.id = w.added_by
       LEFT JOIN users rb ON rb.id = w.reversed_by
       WHERE w.id = ? OR w.support_number = ?`,
      [id, id]
    );

    if (records.length === 0) {
      res.status(404).json({ success: false, message: 'Welfare record not found' });
      return;
    }

    const welfare = records[0];

    // User access check
    if (req.user?.role === 'User' && req.user.memberProfileId !== welfare.member_id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    welfare.amount = Number(welfare.amount);
    welfare.payment_date = welfare.payment_date
      ? welfare.payment_date.toISOString?.().split('T')[0] || welfare.payment_date
      : null;

    res.json({ success: true, welfare });
  } catch (error) {
    console.error('getWelfareById error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve welfare record' });
  }
}

export async function createWelfare(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role === 'User') {
      res.status(403).json({ success: false, message: 'Users are not authorized to create welfare records.' });
      return;
    }

    const parseResult = createWelfareSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const data = parseResult.data;

    const members = await query<any[]>(
      `SELECT id, cnic, name, membership_status FROM member_profiles WHERE id = ? AND archived_at IS NULL`,
      [data.memberId]
    );

    if (members.length === 0) {
      res.status(404).json({ success: false, message: 'Specified member does not exist.' });
      return;
    }

    const member = members[0];

    const result = await withTransaction(async (conn) => {
      const supportNumber = await generateSupportNumber(conn);

      const [insertResult]: any = await conn.query(
        `INSERT INTO welfare_support 
          (support_number, member_id, member_cnic, member_name, payment_date, amount,
           support_area_id, support_area, description, payment_method, reference_number,
           status, added_by, posted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supportNumber,
          member.id,
          member.cnic,
          member.name,
          data.paymentDate,
          data.amount,
          data.supportAreaId || null,
          data.supportArea,
          data.description,
          data.paymentMethod,
          data.referenceNumber || null,
          data.status,
          req.user!.id,
          data.status === 'Posted' ? new Date() : null,
        ]
      );

      return { id: insertResult.insertId, supportNumber };
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_WELFARE',
      entityType: 'WELFARE',
      entityId: result.id,
      newValue: {
        supportNumber: result.supportNumber,
        memberCnic: member.cnic,
        amount: data.amount,
        supportArea: data.supportArea,
        status: data.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Welfare assistance recorded successfully',
      data: {
        id: result.id,
        supportNumber: result.supportNumber,
        amount: data.amount,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('createWelfare error:', error);
    res.status(500).json({ success: false, message: 'Failed to record welfare assistance' });
  }
}

export async function postWelfare(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role === 'User') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const records = await query<any[]>(`SELECT * FROM welfare_support WHERE id = ?`, [id]);
    if (records.length === 0) {
      res.status(404).json({ success: false, message: 'Welfare record not found' });
      return;
    }

    const welfare = records[0];
    if (welfare.status !== 'Draft') {
      res.status(400).json({ success: false, message: `Only Draft welfare records can be posted. Current status: ${welfare.status}` });
      return;
    }

    await query(`UPDATE welfare_support SET status = 'Posted', posted_at = NOW() WHERE id = ?`, [id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'POST_WELFARE',
      entityType: 'WELFARE',
      entityId: id,
      previousValue: { status: 'Draft' },
      newValue: { status: 'Posted' },
      req,
    });

    res.json({ success: true, message: 'Welfare record successfully posted' });
  } catch (error) {
    console.error('postWelfare error:', error);
    res.status(500).json({ success: false, message: 'Failed to post welfare record' });
  }
}

export async function reverseWelfare(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({
        success: false,
        message: 'Only Super Admin is authorized to reverse welfare support records.',
      });
      return;
    }

    const { id } = req.params;
    const parseResult = reversalSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Reversal reason is required',
      });
      return;
    }

    const { reason } = parseResult.data;

    const records = await query<any[]>(`SELECT * FROM welfare_support WHERE id = ?`, [id]);
    if (records.length === 0) {
      res.status(404).json({ success: false, message: 'Welfare record not found' });
      return;
    }

    const welfare = records[0];
    if (welfare.status === 'Reversed') {
      res.status(400).json({ success: false, message: 'This welfare record has already been reversed.' });
      return;
    }

    await query(
      `UPDATE welfare_support SET
        status = 'Reversed',
        reversed_at = NOW(),
        reversed_by = ?,
        reversal_reason = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, reason, id]
    );

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'REVERSE_WELFARE',
      entityType: 'WELFARE',
      entityId: id,
      previousValue: { status: welfare.status, amount: welfare.amount },
      newValue: { status: 'Reversed', reason },
      reason,
      req,
    });

    res.json({
      success: true,
      message: 'Welfare record has been reversed through audited workflow. Historical transaction is preserved.',
    });
  } catch (error) {
    console.error('reverseWelfare error:', error);
    res.status(500).json({ success: false, message: 'Failed to reverse welfare record' });
  }
}
