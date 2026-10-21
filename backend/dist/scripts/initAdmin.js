"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../config/db.js");
async function initAdmin() {
    console.log('--- Initializing Super Administrator Account ---');
    const adminCnic = process.env.ADMIN_CNIC || '1234567890123';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const adminName = process.env.ADMIN_NAME || 'System Super Administrator';
    const adminContact = '03001234567';
    try {
        const existing = await (0, db_js_1.query)(`SELECT id, cnic, role FROM users WHERE cnic = ?`, [adminCnic]);
        if (existing.length > 0) {
            console.log(`[INFO] Super Admin account already exists with CNIC: ${adminCnic}`);
            process.exit(0);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(adminPassword, salt);
        // 1. Insert user
        const userRes = await (0, db_js_1.query)(`INSERT INTO users (cnic, password_hash, role, status, must_change_password)
       VALUES (?, ?, 'Super Admin', 'Active', 0)`, [adminCnic, passwordHash]);
        const userId = userRes.insertId;
        // 2. Insert member profile for Super Admin
        const profileRes = await (0, db_js_1.query)(`INSERT INTO member_profiles
        (user_id, member_id, cnic, name, father_name, rank_name, posting, address,
         zone_name, sector_name, beat_name, contact, date_of_birth, membership_date,
         membership_status, created_by)
       VALUES (?, 'MEM-2026-0001', ?, ?, 'Muhammad Administrator', 'Superintendent', 'Central Headquarters',
               'HQ Complex, Executive Wing', 'Central Zone', 'Sector Central Core', 'Beat 08 - Secretariat Zone',
               ?, '1980-01-01', '2020-01-01', 'Active', ?)`, [userId, adminCnic, adminName, adminContact, userId]);
        console.log(`[SUCCESS] Initial Super Admin successfully created!`);
        console.log(`  CNIC: ${adminCnic}`);
        console.log(`  Password: ${adminPassword}`);
        console.log(`  Role: Super Admin`);
        console.log(`  User ID: ${userId} | Member Profile ID: ${profileRes.insertId}`);
    }
    catch (err) {
        console.error('[ERROR] Failed to initialize Super Admin:', err);
        process.exit(1);
    }
    finally {
        await db_js_1.pool.end();
    }
}
initAdmin();
