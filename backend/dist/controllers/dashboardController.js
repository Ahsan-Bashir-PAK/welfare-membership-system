"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
exports.getDashboardCharts = getDashboardCharts;
const db_js_1 = require("../config/db.js");
async function getDashboardSummary(req, res) {
    try {
        // Current dates
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        // Membership queries
        const [memberStats] = await (0, db_js_1.query)(`
      SELECT 
        COUNT(*) AS total_members,
        SUM(CASE WHEN membership_status = 'Active' THEN 1 ELSE 0 END) AS active_members,
        SUM(CASE WHEN membership_status = 'Disable' THEN 1 ELSE 0 END) AS disabled_members,
        SUM(CASE WHEN membership_date >= ? THEN 1 ELSE 0 END) AS new_this_month,
        SUM(CASE WHEN membership_date >= ? THEN 1 ELSE 0 END) AS new_this_year
      FROM member_profiles
      WHERE archived_at IS NULL
    `, [firstDayOfMonth, firstDayOfYear]);
        // Role queries
        const [roleStats] = await (0, db_js_1.query)(`
      SELECT
        SUM(CASE WHEN role = 'Super Admin' AND status = 'Active' THEN 1 ELSE 0 END) AS total_super_admins,
        SUM(CASE WHEN role = 'Focal Person' AND status = 'Active' THEN 1 ELSE 0 END) AS total_focal_persons,
        SUM(CASE WHEN role = 'User' AND status = 'Active' THEN 1 ELSE 0 END) AS total_regular_users
      FROM users
    `);
        // Payment queries (Only 'Posted' status)
        const [paymentStats] = await (0, db_js_1.query)(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_payments,
        COALESCE(SUM(CASE WHEN payment_date = ? THEN amount ELSE 0 END), 0) AS payments_today,
        COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount ELSE 0 END), 0) AS payments_this_month,
        COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount ELSE 0 END), 0) AS payments_this_year,
        COUNT(*) AS count_payments
      FROM payments
      WHERE status = 'Posted'
    `, [todayStr, firstDayOfMonth, firstDayOfYear]);
        // Welfare queries (Only 'Posted' status)
        const [welfareStats] = await (0, db_js_1.query)(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_welfare,
        COALESCE(SUM(CASE WHEN payment_date = ? THEN amount ELSE 0 END), 0) AS welfare_today,
        COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount ELSE 0 END), 0) AS welfare_this_month,
        COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount ELSE 0 END), 0) AS welfare_this_year,
        COUNT(*) AS count_welfare
      FROM welfare_support
      WHERE status = 'Posted'
    `, [todayStr, firstDayOfMonth, firstDayOfYear]);
        // Transfer queries (Only 'Posted' status)
        const [transferStats] = await (0, db_js_1.query)(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_transfer_volume,
        COUNT(*) AS total_transfers_count,
        COALESCE(SUM(CASE WHEN transfer_date = ? THEN amount ELSE 0 END), 0) AS transfers_today_volume,
        SUM(CASE WHEN transfer_date = ? THEN 1 ELSE 0 END) AS transfers_today_count,
        COALESCE(SUM(CASE WHEN transfer_date >= ? THEN amount ELSE 0 END), 0) AS transfers_this_month_volume,
        SUM(CASE WHEN transfer_date >= ? THEN 1 ELSE 0 END) AS transfers_this_month_count,
        COALESCE(SUM(CASE WHEN transfer_date >= ? THEN amount ELSE 0 END), 0) AS transfers_this_year_volume,
        SUM(CASE WHEN transfer_date >= ? THEN 1 ELSE 0 END) AS transfers_this_year_count
      FROM fund_transfers
      WHERE status = 'Posted'
    `, [todayStr, todayStr, firstDayOfMonth, firstDayOfMonth, firstDayOfYear, firstDayOfYear]);
        // Check system settings for Org fund status
        const [fundSetting] = await (0, db_js_1.query)(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'org_fund_status'
    `);
        const orgFundStatus = fundSetting?.setting_value || 'Not Configured';
        res.json({
            success: true,
            data: {
                membership: {
                    total: Number(memberStats?.total_members || 0),
                    active: Number(memberStats?.active_members || 0),
                    disabled: Number(memberStats?.disabled_members || 0),
                    superAdmins: Number(roleStats?.total_super_admins || 0),
                    focalPersons: Number(roleStats?.total_focal_persons || 0),
                    regularUsers: Number(roleStats?.total_regular_users || 0),
                    newThisMonth: Number(memberStats?.new_this_month || 0),
                    newThisYear: Number(memberStats?.new_this_year || 0),
                },
                payments: {
                    total: Number(paymentStats?.total_payments || 0),
                    today: Number(paymentStats?.payments_today || 0),
                    thisMonth: Number(paymentStats?.payments_this_month || 0),
                    thisYear: Number(paymentStats?.payments_this_year || 0),
                    count: Number(paymentStats?.count_payments || 0),
                },
                welfare: {
                    total: Number(welfareStats?.total_welfare || 0),
                    today: Number(welfareStats?.welfare_today || 0),
                    thisMonth: Number(welfareStats?.welfare_this_month || 0),
                    thisYear: Number(welfareStats?.welfare_this_year || 0),
                    count: Number(welfareStats?.count_welfare || 0),
                },
                transfers: {
                    totalVolume: Number(transferStats?.total_transfer_volume || 0),
                    totalCount: Number(transferStats?.total_transfers_count || 0),
                    todayVolume: Number(transferStats?.transfers_today_volume || 0),
                    todayCount: Number(transferStats?.transfers_today_count || 0),
                    thisMonthVolume: Number(transferStats?.transfers_this_month_volume || 0),
                    thisMonthCount: Number(transferStats?.transfers_this_month_count || 0),
                    thisYearVolume: Number(transferStats?.transfers_this_year_volume || 0),
                    thisYearCount: Number(transferStats?.transfers_this_year_count || 0),
                    isRecordOnly: true,
                },
                organizationalFund: {
                    status: orgFundStatus,
                    notice: orgFundStatus === 'Not Configured'
                        ? 'Organizational fund opening balance has not been initialized. No simulated balance is fabricated.'
                        : 'Configured',
                },
            },
        });
    }
    catch (error) {
        console.error('getDashboardSummary error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve dashboard summary' });
    }
}
async function getDashboardCharts(req, res) {
    try {
        // 1. Members by Status
        const membersByStatus = await (0, db_js_1.query)(`
      SELECT membership_status AS status, COUNT(*) AS count
      FROM member_profiles
      WHERE archived_at IS NULL
      GROUP BY membership_status
    `);
        // 2. Members by Role
        const membersByRole = await (0, db_js_1.query)(`
      SELECT role, COUNT(*) AS count
      FROM users
      GROUP BY role
    `);
        // 3. Members by Zone
        const membersByZone = await (0, db_js_1.query)(`
      SELECT COALESCE(zone_name, 'Unassigned') AS zone, COUNT(*) AS count
      FROM member_profiles
      WHERE archived_at IS NULL
      GROUP BY zone_name
      ORDER BY count DESC
    `);
        // 4. Members by Rank
        const membersByRank = await (0, db_js_1.query)(`
      SELECT COALESCE(rank_name, 'Unassigned') AS ` + "`rank`" + `, COUNT(*) AS count
      FROM member_profiles
      WHERE archived_at IS NULL
      GROUP BY rank_name
      ORDER BY count DESC
      LIMIT 10
    `);
        // 5. Monthly Payments Collections (Last 12 months)
        const monthlyPayments = await (0, db_js_1.query)(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(*) AS count
      FROM payments
      WHERE status = 'Posted' AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
      ORDER BY month ASC
    `);
        // 6. Monthly Welfare Support (Last 12 months)
        const monthlyWelfare = await (0, db_js_1.query)(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(*) AS count
      FROM welfare_support
      WHERE status = 'Posted' AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
      ORDER BY month ASC
    `);
        // 7. Monthly Transfer Volume (Last 12 months - record only)
        const monthlyTransfers = await (0, db_js_1.query)(`
      SELECT 
        DATE_FORMAT(transfer_date, '%Y-%m') AS month,
        COALESCE(SUM(amount), 0) AS total_volume,
        COUNT(*) AS count
      FROM fund_transfers
      WHERE status = 'Posted' AND transfer_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(transfer_date, '%Y-%m')
      ORDER BY month ASC
    `);
        // 8. Payment Type Distribution
        const paymentsByType = await (0, db_js_1.query)(`
      SELECT payment_type AS type, COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS count
      FROM payments
      WHERE status = 'Posted'
      GROUP BY payment_type
    `);
        // 9. Welfare Support by Area
        const welfareByArea = await (0, db_js_1.query)(`
      SELECT support_area AS area, COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS count
      FROM welfare_support
      WHERE status = 'Posted'
      GROUP BY support_area
    `);
        res.json({
            success: true,
            data: {
                membersByStatus: membersByStatus.map((r) => ({ name: r.status, value: Number(r.count) })),
                membersByRole: membersByRole.map((r) => ({ name: r.role, value: Number(r.count) })),
                membersByZone: membersByZone.map((r) => ({ name: r.zone, value: Number(r.count) })),
                membersByRank: membersByRank.map((r) => ({ name: r.rank, value: Number(r.count) })),
                monthlyPayments: monthlyPayments.map((r) => ({
                    month: r.month,
                    amount: Number(r.total_amount),
                    count: Number(r.count),
                })),
                monthlyWelfare: monthlyWelfare.map((r) => ({
                    month: r.month,
                    amount: Number(r.total_amount),
                    count: Number(r.count),
                })),
                monthlyTransfers: monthlyTransfers.map((r) => ({
                    month: r.month,
                    volume: Number(r.total_volume),
                    count: Number(r.count),
                })),
                paymentsByType: paymentsByType.map((r) => ({
                    name: r.type,
                    amount: Number(r.total_amount),
                    count: Number(r.count),
                })),
                welfareByArea: welfareByArea.map((r) => ({
                    name: r.area,
                    amount: Number(r.total_amount),
                    count: Number(r.count),
                })),
            },
        });
    }
    catch (error) {
        console.error('getDashboardCharts error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve dashboard chart metrics' });
    }
}
