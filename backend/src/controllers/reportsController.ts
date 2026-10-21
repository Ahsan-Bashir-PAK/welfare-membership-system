import type { Request, Response } from 'express';
import { query } from '../config/db.js';
import * as XLSX from 'xlsx';

export async function getMemberReport(req: Request, res: Response): Promise<void> {
  try {
    const { status, role, rankId, zoneId, startDate, endDate, exportFormat } = req.query;

    const conditions: string[] = ['mp.archived_at IS NULL'];
    const params: any[] = [];

    if (status) {
      conditions.push('mp.membership_status = ?');
      params.push(status);
    }
    if (role) {
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
    if (startDate) {
      conditions.push('mp.membership_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('mp.membership_date <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const members = await query<any[]>(
      `SELECT mp.member_id, mp.cnic, mp.name, mp.father_name, mp.rank_name,
              mp.posting, mp.zone_name, mp.sector_name, mp.beat_name, mp.contact,
              mp.membership_date, mp.membership_status, u.role AS account_role
       FROM member_profiles mp
       JOIN users u ON u.id = mp.user_id
       ${where}
       ORDER BY mp.id ASC`,
      params
    );

    const formatted = members.map((m) => ({
      'Member ID': m.member_id,
      'CNIC': m.cnic,
      'Full Name': m.name,
      'Father Name': m.father_name,
      'Rank': m.rank_name,
      'Posting': m.posting,
      'Zone': m.zone_name,
      'Sector': m.sector_name,
      'Beat': m.beat_name,
      'Contact': m.contact,
      'Membership Date': m.membership_date ? (m.membership_date.toISOString?.().split('T')[0] || m.membership_date) : '',
      'Status': m.membership_status,
      'Account Role': m.account_role,
    }));

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Members');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="Member_Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
      return;
    }

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('getMemberReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate member report' });
  }
}

export async function getPaymentReport(req: Request, res: Response): Promise<void> {
  try {
    const { status, paymentType, paymentMethod, startDate, endDate, exportFormat } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await query<any[]>(
      `SELECT p.payment_number, p.member_cnic, p.member_name, p.payment_date,
              p.amount, p.payment_type, p.payment_method, p.reference_number,
              p.status, ab.cnic AS recorded_by_cnic
       FROM payments p
       LEFT JOIN users ab ON ab.id = p.added_by
       ${where}
       ORDER BY p.payment_date DESC`,
      params
    );

    const formatted = records.map((r) => ({
      'Receipt / Payment No': r.payment_number,
      'Member CNIC': r.member_cnic,
      'Member Name': r.member_name,
      'Date': r.payment_date ? (r.payment_date.toISOString?.().split('T')[0] || r.payment_date) : '',
      'Amount (PKR)': Number(r.amount).toFixed(2),
      'Payment Type': r.payment_type,
      'Payment Method': r.payment_method,
      'Reference No': r.reference_number || 'N/A',
      'Status': r.status,
      'Recorded By': r.recorded_by_cnic || '',
    }));

    const totalPosted = records
      .filter((r) => r.status === 'Posted')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="Payment_Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
      return;
    }

    res.json({ success: true, count: formatted.length, totalPosted, data: formatted });
  } catch (error) {
    console.error('getPaymentReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payment report' });
  }
}

export async function getWelfareReport(req: Request, res: Response): Promise<void> {
  try {
    const { status, supportArea, startDate, endDate, exportFormat } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('w.status = ?');
      params.push(status);
    }
    if (supportArea) {
      conditions.push('w.support_area = ?');
      params.push(supportArea);
    }
    if (startDate) {
      conditions.push('w.payment_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('w.payment_date <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await query<any[]>(
      `SELECT w.support_number, w.member_cnic, w.member_name, w.payment_date,
              w.amount, w.support_area, w.payment_method, w.description,
              w.status, ab.cnic AS recorded_by_cnic
       FROM welfare_support w
       LEFT JOIN users ab ON ab.id = w.added_by
       ${where}
       ORDER BY w.payment_date DESC`,
      params
    );

    const formatted = records.map((r) => ({
      'Support Voucher No': r.support_number,
      'Beneficiary CNIC': r.member_cnic,
      'Beneficiary Name': r.member_name,
      'Disbursement Date': r.payment_date ? (r.payment_date.toISOString?.().split('T')[0] || r.payment_date) : '',
      'Amount (PKR)': Number(r.amount).toFixed(2),
      'Support Area': r.support_area,
      'Payment Method': r.payment_method,
      'Description': r.description,
      'Status': r.status,
      'Recorded By': r.recorded_by_cnic || '',
    }));

    const totalPosted = records
      .filter((r) => r.status === 'Posted')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Welfare');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="Welfare_Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
      return;
    }

    res.json({ success: true, count: formatted.length, totalPosted, data: formatted });
  } catch (error) {
    console.error('getWelfareReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate welfare report' });
  }
}

export async function getTransferReport(req: Request, res: Response): Promise<void> {
  try {
    const { status, startDate, endDate, exportFormat } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await query<any[]>(
      `SELECT t.transfer_number, t.transfer_date, t.sender_cnic, t.sender_name,
              t.receiver_cnic, t.receiver_name, t.amount, t.transfer_purpose,
              t.payment_method, t.reference_number, t.status,
              ab.cnic AS recorded_by_cnic
       FROM fund_transfers t
       LEFT JOIN users ab ON ab.id = t.added_by
       ${where}
       ORDER BY t.transfer_date DESC`,
      params
    );

    const formatted = records.map((r) => ({
      'Transfer Register No': r.transfer_number,
      'Transfer Date': r.transfer_date ? (r.transfer_date.toISOString?.().split('T')[0] || r.transfer_date) : '',
      'Sender CNIC': r.sender_cnic,
      'Sender Name': r.sender_name,
      'Receiver CNIC': r.receiver_cnic,
      'Receiver Name': r.receiver_name,
      'Amount (PKR)': Number(r.amount).toFixed(2),
      'Purpose': r.transfer_purpose,
      'Method': r.payment_method,
      'Status': r.status,
      'Recorded By': r.recorded_by_cnic || '',
    }));

    const totalPostedVolume = records
      .filter((r) => r.status === 'Posted')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transfers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="Transfer_Register_Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
      return;
    }

    res.json({
      success: true,
      count: formatted.length,
      totalPostedVolume,
      classification: 'Recorded Member-to-Member Transaction Register',
      notice: 'Transfer amounts reflect peer-to-peer volume and do NOT impact organizational fund balances.',
      data: formatted,
    });
  } catch (error) {
    console.error('getTransferReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate transfer report' });
  }
}

export async function getOrganizationalFundReport(req: Request, res: Response): Promise<void> {
  try {
    const [fundSetting]: any = await query(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'org_fund_status'
    `);
    const status = fundSetting?.setting_value || 'Not Configured';

    if (status === 'Not Configured') {
      res.json({
        success: true,
        status: 'Not Configured',
        message: 'Organizational Fund balance is not initialized. No opening balance has been verified or configured.',
        fundBalance: null,
        breakdown: null,
      });
      return;
    }

    // If configured, calculate strictly from posted records
    const [paymentsSum]: any = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total_income FROM payments WHERE status = 'Posted'
    `);

    const [welfareSum]: any = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total_disbursed FROM welfare_support WHERE status = 'Posted'
    `);

    const totalIncome = Number(paymentsSum?.total_income || 0);
    const totalWelfare = Number(welfareSum?.total_disbursed || 0);
    const calculatedClosingBalance = totalIncome - totalWelfare;

    res.json({
      success: true,
      status: 'Active',
      openingBalance: 0,
      totalRecordedIncome: totalIncome,
      totalWelfareDisbursed: totalWelfare,
      closingFundBalance: calculatedClosingBalance,
      transferNotice: 'Member-to-member transfers are excluded as they do not constitute organizational funds.',
    });
  } catch (error) {
    console.error('getOrganizationalFundReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate fund report' });
  }
}
