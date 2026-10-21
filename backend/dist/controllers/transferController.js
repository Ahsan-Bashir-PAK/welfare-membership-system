"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransfers = getTransfers;
exports.getTransferById = getTransferById;
exports.createTransfer = createTransfer;
exports.postTransfer = postTransfer;
exports.reverseTransfer = reverseTransfer;
const db_js_1 = require("../config/db.js");
const schemas_js_1 = require("../validators/schemas.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
async function generateTransferNumber(conn) {
    const currentYear = new Date().getFullYear();
    const prefix = `TRF-${currentYear}-`;
    const [rows] = await conn.query(`SELECT transfer_number FROM fund_transfers WHERE transfer_number LIKE ? ORDER BY id DESC LIMIT 1`, [`${prefix}%`]);
    let nextNum = 1;
    if (rows.length > 0) {
        const lastNum = rows[0].transfer_number;
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
async function getTransfers(req, res) {
    try {
        const { search, senderCnic, receiverCnic, status, startDate, endDate, page = '1', limit = '10', sortBy = 'id', sortOrder = 'DESC', } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;
        const conditions = [];
        const params = [];
        // Role-based scoping: regular user can only view transfers where they are sender or receiver
        if (req.user?.role === 'User') {
            conditions.push('(t.sender_id = ? OR t.receiver_id = ?)');
            params.push(req.user.memberProfileId || -1, req.user.memberProfileId || -1);
        }
        if (senderCnic) {
            conditions.push('t.sender_cnic = ?');
            params.push(senderCnic);
        }
        if (receiverCnic) {
            conditions.push('t.receiver_cnic = ?');
            params.push(receiverCnic);
        }
        if (search) {
            const s = `%${String(search).trim()}%`;
            conditions.push('(t.transfer_number LIKE ? OR t.sender_cnic LIKE ? OR t.sender_name LIKE ? OR t.receiver_cnic LIKE ? OR t.receiver_name LIKE ? OR t.reference_number LIKE ?)');
            params.push(s, s, s, s, s, s);
        }
        if (status && ['Draft', 'Posted', 'Reversed'].includes(status)) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (startDate) {
            conditions.push('t.transfer_date >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('t.transfer_date <= ?');
            params.push(endDate);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await (0, db_js_1.query)(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN t.status = 'Posted' THEN t.amount ELSE 0 END), 0) AS total_amount
       FROM fund_transfers t ${whereClause}`, params);
        const total = countResult[0]?.total || 0;
        const totalAmount = countResult[0]?.total_amount || 0;
        const allowedSortCols = {
            id: 't.id',
            transferNumber: 't.transfer_number',
            date: 't.transfer_date',
            amount: 't.amount',
            status: 't.status',
            senderName: 't.sender_name',
            receiverName: 't.receiver_name',
        };
        const sortCol = allowedSortCols[sortBy] || 't.id';
        const sortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const dataQuery = `
      SELECT t.*,
             ab.cnic AS added_by_cnic,
             rb.cnic AS reversed_by_cnic
      FROM fund_transfers t
      LEFT JOIN users ab ON ab.id = t.added_by
      LEFT JOIN users rb ON rb.id = t.reversed_by
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;
        const records = await (0, db_js_1.query)(dataQuery, [...params, limitNum, offset]);
        res.json({
            success: true,
            data: records.map((r) => ({
                ...r,
                amount: Number(r.amount),
                transfer_date: r.transfer_date ? (r.transfer_date.toISOString?.().split('T')[0] || r.transfer_date) : null,
            })),
            totalRecordedTransferVolume: Number(totalAmount),
            volumeNotice: 'Member-to-member transfers are recorded historical transactions and do not constitute organizational revenue or fund balance.',
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('getTransfers error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve transfer register' });
    }
}
async function getTransferById(req, res) {
    try {
        const { id } = req.params;
        const records = await (0, db_js_1.query)(`SELECT t.*,
              sm.member_id AS sender_member_code, sm.contact AS sender_contact,
              rm.member_id AS receiver_member_code, rm.contact AS receiver_contact,
              ab.cnic AS added_by_cnic,
              rb.cnic AS reversed_by_cnic
       FROM fund_transfers t
       JOIN member_profiles sm ON sm.id = t.sender_id
       JOIN member_profiles rm ON rm.id = t.receiver_id
       LEFT JOIN users ab ON ab.id = t.added_by
       LEFT JOIN users rb ON rb.id = t.reversed_by
       WHERE t.id = ? OR t.transfer_number = ?`, [id, id]);
        if (records.length === 0) {
            res.status(404).json({ success: false, message: 'Transfer record not found' });
            return;
        }
        const transfer = records[0];
        // Regular users can only access transfers where they are sender or receiver
        if (req.user?.role === 'User' &&
            req.user.memberProfileId !== transfer.sender_id &&
            req.user.memberProfileId !== transfer.receiver_id) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        transfer.amount = Number(transfer.amount);
        transfer.transfer_date = transfer.transfer_date
            ? transfer.transfer_date.toISOString?.().split('T')[0] || transfer.transfer_date
            : null;
        res.json({ success: true, transfer });
    }
    catch (error) {
        console.error('getTransferById error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve transfer record' });
    }
}
async function createTransfer(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        if (req.user.role === 'User') {
            res.status(403).json({ success: false, message: 'Users are not authorized to record member transfers.' });
            return;
        }
        const parseResult = schemas_js_1.createTransferSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Validation error',
            });
            return;
        }
        const data = parseResult.data;
        if (data.senderId === data.receiverId) {
            res.status(400).json({ success: false, message: 'Sender and receiver cannot be the same member.' });
            return;
        }
        // Verify sender exists
        const senders = await (0, db_js_1.query)(`SELECT id, cnic, name FROM member_profiles WHERE id = ? AND archived_at IS NULL`, [data.senderId]);
        if (senders.length === 0) {
            res.status(404).json({ success: false, message: 'Sender member not found.' });
            return;
        }
        // Verify receiver exists
        const receivers = await (0, db_js_1.query)(`SELECT id, cnic, name FROM member_profiles WHERE id = ? AND archived_at IS NULL`, [data.receiverId]);
        if (receivers.length === 0) {
            res.status(404).json({ success: false, message: 'Receiver member not found.' });
            return;
        }
        const sender = senders[0];
        const receiver = receivers[0];
        // Record-only register: NO deductions, NO wallets, NO virtual balances!
        const result = await (0, db_js_1.withTransaction)(async (conn) => {
            const transferNumber = await generateTransferNumber(conn);
            const [insertResult] = await conn.query(`INSERT INTO fund_transfers 
          (transfer_number, transfer_date, sender_id, sender_cnic, sender_name,
           receiver_id, receiver_cnic, receiver_name, amount, transfer_purpose,
           payment_method, reference_number, remarks, status, added_by, posted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                transferNumber,
                data.transferDate,
                sender.id,
                sender.cnic,
                sender.name,
                receiver.id,
                receiver.cnic,
                receiver.name,
                data.amount,
                data.transferPurpose,
                data.paymentMethod,
                data.referenceNumber || null,
                data.remarks || null,
                data.status,
                req.user.id,
                data.status === 'Posted' ? new Date() : null,
            ]);
            return { id: insertResult.insertId, transferNumber };
        });
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: req.user.id,
            actorRole: req.user.role,
            actionType: 'CREATE_TRANSFER',
            entityType: 'TRANSFER',
            entityId: result.id,
            newValue: {
                transferNumber: result.transferNumber,
                senderCnic: sender.cnic,
                receiverCnic: receiver.cnic,
                amount: data.amount,
                status: data.status,
            },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Member-to-member transfer registered successfully (Record Only)',
            data: {
                id: result.id,
                transferNumber: result.transferNumber,
                amount: data.amount,
                status: data.status,
            },
        });
    }
    catch (error) {
        console.error('createTransfer error:', error);
        res.status(500).json({ success: false, message: 'Failed to register member transfer' });
    }
}
async function postTransfer(req, res) {
    try {
        if (!req.user || req.user.role === 'User') {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }
        const { id } = req.params;
        const records = await (0, db_js_1.query)(`SELECT * FROM fund_transfers WHERE id = ?`, [id]);
        if (records.length === 0) {
            res.status(404).json({ success: false, message: 'Transfer record not found' });
            return;
        }
        const transfer = records[0];
        if (transfer.status !== 'Draft') {
            res.status(400).json({ success: false, message: `Only Draft transfers can be posted. Current status: ${transfer.status}` });
            return;
        }
        await (0, db_js_1.query)(`UPDATE fund_transfers SET status = 'Posted', posted_at = NOW() WHERE id = ?`, [id]);
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: req.user.id,
            actorRole: req.user.role,
            actionType: 'POST_TRANSFER',
            entityType: 'TRANSFER',
            entityId: id,
            previousValue: { status: 'Draft' },
            newValue: { status: 'Posted' },
            req,
        });
        res.json({ success: true, message: 'Transfer record successfully posted' });
    }
    catch (error) {
        console.error('postTransfer error:', error);
        res.status(500).json({ success: false, message: 'Failed to post transfer record' });
    }
}
async function reverseTransfer(req, res) {
    try {
        if (!req.user || req.user.role !== 'Super Admin') {
            res.status(403).json({
                success: false,
                message: 'Only Super Admin is authorized to reverse member-to-member transfer records.',
            });
            return;
        }
        const { id } = req.params;
        const parseResult = schemas_js_1.reversalSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.errors[0]?.message || 'Reversal reason is required',
            });
            return;
        }
        const { reason } = parseResult.data;
        const records = await (0, db_js_1.query)(`SELECT * FROM fund_transfers WHERE id = ?`, [id]);
        if (records.length === 0) {
            res.status(404).json({ success: false, message: 'Transfer record not found' });
            return;
        }
        const transfer = records[0];
        if (transfer.status === 'Reversed') {
            res.status(400).json({ success: false, message: 'This transfer record has already been reversed.' });
            return;
        }
        await (0, db_js_1.query)(`UPDATE fund_transfers SET
        status = 'Reversed',
        reversed_at = NOW(),
        reversed_by = ?,
        reversal_reason = ?,
        updated_at = NOW()
       WHERE id = ?`, [req.user.id, reason, id]);
        await (0, auditLogger_js_1.createAuditLog)({
            actorId: req.user.id,
            actorRole: req.user.role,
            actionType: 'REVERSE_TRANSFER',
            entityType: 'TRANSFER',
            entityId: id,
            previousValue: { status: transfer.status, amount: transfer.amount },
            newValue: { status: 'Reversed', reason },
            reason,
            req,
        });
        res.json({
            success: true,
            message: 'Transfer record has been reversed through audited workflow. Historical transaction is preserved.',
        });
    }
    catch (error) {
        console.error('reverseTransfer error:', error);
        res.status(500).json({ success: false, message: 'Failed to reverse transfer record' });
    }
}
