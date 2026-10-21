import type { Request, Response } from 'express';
import { query, withTransaction } from '../config/db.js';
import { createPaymentSchema, reversalSchema } from '../validators/schemas.js';
import { createAuditLog } from '../utils/auditLogger.js';

async function generatePaymentNumber(conn: any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PAY-${currentYear}-`;
  const [rows]: any = await conn.query(
    `SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].payment_number;
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

export async function getPayments(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      memberId,
      status,
      paymentType,
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

    // Role scoping: regular user can only view their own payments
    if (req.user?.role === 'User') {
      conditions.push('p.member_id = ?');
      params.push(req.user.memberProfileId || -1);
    }

    if (memberId) {
      conditions.push('p.member_id = ?');
      params.push(parseInt(memberId as string, 10));
    }

    if (search) {
      const s = `%${String(search).trim()}%`;
      conditions.push('(p.payment_number LIKE ? OR p.member_cnic LIKE ? OR p.member_name LIKE ? OR p.reference_number LIKE ?)');
      params.push(s, s, s, s);
    }

    if (status && ['Draft', 'Posted', 'Reversed'].includes(status as string)) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (paymentType) {
      conditions.push('p.payment_type = ?');
      params.push(paymentType);
    }

    if (paymentMethod) {
      conditions.push('p.payment_method = ?');
      params.push(paymentMethod);
    }

    if (startDate) {
      conditions.push('p.payment_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('p.payment_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN p.status = 'Posted' THEN p.amount ELSE 0 END), 0) AS total_amount
       FROM payments p ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;
    const totalAmount = countResult[0]?.total_amount || 0;

    const allowedSortCols: Record<string, string> = {
      id: 'p.id',
      paymentNumber: 'p.payment_number',
      date: 'p.payment_date',
      amount: 'p.amount',
      status: 'p.status',
      name: 'p.member_name',
      cnic: 'p.member_cnic',
    };
    const sortCol = allowedSortCols[sortBy as string] || 'p.id';
    const sortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT p.*,
             ab.cnic AS added_by_cnic,
             rb.cnic AS reversed_by_cnic
      FROM payments p
      LEFT JOIN users ab ON ab.id = p.added_by
      LEFT JOIN users rb ON rb.id = p.reversed_by
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
    console.error('getPayments error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payments' });
  }
}

export async function getPaymentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const records = await query<any[]>(
      `SELECT p.*,
              mp.member_id AS member_code, mp.rank_name, mp.zone_name, mp.contact,
              ab.cnic AS added_by_cnic,
              rb.cnic AS reversed_by_cnic
       FROM payments p
       JOIN member_profiles mp ON mp.id = p.member_id
       LEFT JOIN users ab ON ab.id = p.added_by
       LEFT JOIN users rb ON rb.id = p.reversed_by
       WHERE p.id = ? OR p.payment_number = ?`,
      [id, id]
    );

    if (records.length === 0) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const payment = records[0];

    // User access check
    if (req.user?.role === 'User' && req.user.memberProfileId !== payment.member_id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    payment.amount = Number(payment.amount);
    payment.payment_date = payment.payment_date
      ? payment.payment_date.toISOString?.().split('T')[0] || payment.payment_date
      : null;

    res.json({ success: true, payment });
  } catch (error) {
    console.error('getPaymentById error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment record' });
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Regular users cannot add payments
    if (req.user.role === 'User') {
      res.status(403).json({ success: false, message: 'Users are not authorized to record payments.' });
      return;
    }

    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const data = parseResult.data;

    // Verify member exists
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
      const paymentNumber = await generatePaymentNumber(conn);

      const [insertResult]: any = await conn.query(
        `INSERT INTO payments 
          (payment_number, member_id, member_cnic, member_name, payment_date, amount,
           payment_type, payment_method, reference_number, remarks, status, added_by, posted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentNumber,
          member.id,
          member.cnic,
          member.name,
          data.paymentDate,
          data.amount,
          data.paymentType,
          data.paymentMethod,
          data.referenceNumber || null,
          data.remarks || null,
          data.status,
          req.user!.id,
          data.status === 'Posted' ? new Date() : null,
        ]
      );

      return { id: insertResult.insertId, paymentNumber };
    });

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'CREATE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: result.id,
      newValue: {
        paymentNumber: result.paymentNumber,
        memberCnic: member.cnic,
        amount: data.amount,
        paymentType: data.paymentType,
        status: data.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        id: result.id,
        paymentNumber: result.paymentNumber,
        amount: data.amount,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
}

export async function postPayment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role === 'User') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const payments = await query<any[]>(`SELECT * FROM payments WHERE id = ?`, [id]);
    if (payments.length === 0) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const payment = payments[0];
    if (payment.status !== 'Draft') {
      res.status(400).json({ success: false, message: `Only Draft payments can be posted. Current status: ${payment.status}` });
      return;
    }

    await query(`UPDATE payments SET status = 'Posted', posted_at = NOW() WHERE id = ?`, [id]);

    await createAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actionType: 'POST_PAYMENT',
      entityType: 'PAYMENT',
      entityId: id,
      previousValue: { status: 'Draft' },
      newValue: { status: 'Posted' },
      req,
    });

    res.json({ success: true, message: 'Payment successfully posted' });
  } catch (error) {
    console.error('postPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to post payment' });
  }
}

export async function reversePayment(req: Request, res: Response): Promise<void> {
  try {
    // Only Super Admin can execute financial reversal
    if (!req.user || req.user.role !== 'Super Admin') {
      res.status(403).json({
        success: false,
        message: 'Only Super Admin is authorized to execute audited payment reversals.',
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

    const payments = await query<any[]>(`SELECT * FROM payments WHERE id = ?`, [id]);
    if (payments.length === 0) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const payment = payments[0];
    if (payment.status === 'Reversed') {
      res.status(400).json({ success: false, message: 'This payment has already been reversed.' });
      return;
    }

    // Execute reversal: preserve original transaction, update status and reversal metadata
    await query(
      `UPDATE payments SET
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
      actionType: 'REVERSE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: id,
      previousValue: { status: payment.status, amount: payment.amount },
      newValue: { status: 'Reversed', reason },
      reason,
      req,
    });

    res.json({
      success: true,
      message: 'Payment has been reversed through audited workflow. Historical transaction is preserved.',
    });
  } catch (error) {
    console.error('reversePayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to reverse payment' });
  }
}
