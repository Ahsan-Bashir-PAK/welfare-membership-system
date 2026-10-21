"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../config/db.js");
async function seed() {
    console.log('--- Seeding Institutional Database with Production Test Data ---');
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        // 1. Initial Users and Members
        const membersData = [
            {
                cnic: '1234567890123',
                password: 'AdminPassword123!',
                role: 'Super Admin',
                status: 'Active',
                name: 'Chief Admin Saeed Ullah',
                fatherName: 'Inayat Ullah',
                rankName: 'Superintendent',
                posting: 'Headquarters Executive Directorate',
                address: 'House 14-A, Officers Colony, Central Complex',
                zoneName: 'Central Zone',
                sectorName: 'Sector Central Core',
                beatName: 'Beat 08 - Secretariat Zone',
                contact: '03001234567',
                dob: '1979-05-12',
                membershipDate: '2019-01-01',
            },
            {
                cnic: '2345678901234',
                password: 'FocalPassword123!',
                role: 'Focal Person',
                status: 'Active',
                name: 'Inspector Ahmed Khan',
                fatherName: 'Abdul Rehman Khan',
                rankName: 'Inspector',
                posting: 'North Zone Regional Liaison Office',
                address: 'Apartment 4B, Sector Alpha Enclave',
                zoneName: 'North Zone',
                sectorName: 'Sector Alpha (North)',
                beatName: 'Beat 01 - Commercial Boulevard',
                contact: '03002345678',
                dob: '1984-09-21',
                membershipDate: '2020-03-15',
            },
            {
                cnic: '3456789012345',
                password: 'FocalPassword123!',
                role: 'Focal Person',
                status: 'Active',
                name: 'Sub-Inspector Fatima Zahra',
                fatherName: 'Muhammad Sharif',
                rankName: 'Sub-Inspector',
                posting: 'South Zone Welfare & Coordination Cell',
                address: 'Plot 72, Southern Defense District',
                zoneName: 'South Zone',
                sectorName: 'Sector Charlie (South)',
                beatName: 'Beat 04 - Harbor & Port View',
                contact: '03003456789',
                dob: '1989-11-04',
                membershipDate: '2021-02-10',
            },
            {
                cnic: '4567890123456',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Active',
                name: 'Muhammad Tariq',
                fatherName: 'Ghulam Qadir',
                rankName: 'Assistant Sub-Inspector',
                posting: 'North Zone Operations Squad',
                address: 'Street 9, Northern Heights Colony',
                zoneName: 'North Zone',
                sectorName: 'Sector Alpha (North)',
                beatName: 'Beat 02 - Northern Heights',
                contact: '03004567890',
                dob: '1988-04-15',
                membershipDate: '2021-06-01',
            },
            {
                cnic: '5678901234567',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Active',
                name: 'Zubair Malik',
                fatherName: 'Muhammad Aslam Malik',
                rankName: 'Head Constable',
                posting: 'South Zone Field Support Unit',
                address: 'Flat 12-C, Maritime View Complex',
                zoneName: 'South Zone',
                sectorName: 'Sector Charlie (South)',
                beatName: 'Beat 04 - Harbor & Port View',
                contact: '03005678901',
                dob: '1992-08-20',
                membershipDate: '2022-01-15',
            },
            {
                cnic: '6789012345678',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Active',
                name: 'Bilal Siddiqui',
                fatherName: 'Khurram Siddiqui',
                rankName: 'Constable',
                posting: 'East Zone Traffic Division',
                address: 'House 88, Eastern Highway Enclave',
                zoneName: 'East Zone',
                sectorName: 'Sector Echo (East)',
                beatName: 'Beat 06 - Eastern Ring',
                contact: '03006789012',
                dob: '1995-12-10',
                membershipDate: '2023-04-10',
            },
            {
                cnic: '7890123456789',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Disable', // Disabled user account and membership
                name: 'Rashid Mahmood',
                fatherName: 'Mahmood Akhtar',
                rankName: 'Constable',
                posting: 'West Zone Headquarters',
                address: 'House 22-F, Civic Quarters',
                zoneName: 'West Zone',
                sectorName: 'Sector Foxtrot (West)',
                beatName: 'Beat 07 - Civic Centre',
                contact: '03007890123',
                dob: '1985-02-28',
                membershipDate: '2020-05-18',
            },
            {
                cnic: '8901234567890',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Active',
                name: 'Usman Farooq',
                fatherName: 'Farooq Azam',
                rankName: 'Senior Executive Officer',
                posting: 'Finance & Records Directorate',
                address: 'Executive Suites 05, Central City',
                zoneName: 'Central Zone',
                sectorName: 'Sector Central Core',
                beatName: 'Beat 08 - Secretariat Zone',
                contact: '03008901234',
                dob: '1990-11-05',
                membershipDate: '2024-02-01',
            },
            {
                cnic: '9012345678901',
                password: 'UserPassword123!',
                role: 'User',
                status: 'Active',
                name: 'Imran Qureshi',
                fatherName: 'Bashir Qureshi',
                rankName: 'Junior Executive Member',
                posting: 'Central Logistics Dispatch',
                address: 'House 101, Industrial Extension',
                zoneName: 'North Zone',
                sectorName: 'Sector Bravo (North)',
                beatName: 'Beat 03 - Industrial Enclave',
                contact: '03009012345',
                dob: '1987-07-14',
                membershipDate: '2024-08-12',
            },
        ];
        const insertedMembers = {};
        let memberIndex = 1;
        for (const m of membersData) {
            const existing = await (0, db_js_1.query)(`SELECT id FROM users WHERE cnic = ?`, [m.cnic]);
            let userId;
            if (existing.length === 0) {
                const hash = await bcryptjs_1.default.hash(m.password, salt);
                const uRes = await (0, db_js_1.query)(`INSERT INTO users (cnic, password_hash, role, status, must_change_password) VALUES (?, ?, ?, ?, 0)`, [m.cnic, hash, m.role, m.status]);
                userId = uRes.insertId;
                const memberIdCode = `MEM-2026-${String(memberIndex).padStart(4, '0')}`;
                const pRes = await (0, db_js_1.query)(`INSERT INTO member_profiles 
            (user_id, member_id, cnic, name, father_name, rank_name, posting, address,
             zone_name, sector_name, beat_name, contact, date_of_birth, membership_date,
             membership_status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
                    userId,
                    memberIdCode,
                    m.cnic,
                    m.name,
                    m.fatherName,
                    m.rankName,
                    m.posting,
                    m.address,
                    m.zoneName,
                    m.sectorName,
                    m.beatName,
                    m.contact,
                    m.dob,
                    m.membershipDate,
                    m.status,
                ]);
                insertedMembers[m.cnic] = { userId, memberProfileId: pRes.insertId, name: m.name };
            }
            else {
                userId = existing[0].id;
                const pRows = await (0, db_js_1.query)(`SELECT id FROM member_profiles WHERE user_id = ?`, [userId]);
                insertedMembers[m.cnic] = {
                    userId,
                    memberProfileId: pRows[0]?.id || 1,
                    name: m.name,
                };
            }
            memberIndex++;
        }
        console.log(`[INFO] Seeded ${Object.keys(insertedMembers).length} members.`);
        // 2. Seed Payments
        const tariq = insertedMembers['4567890123456'];
        const zubair = insertedMembers['5678901234567'];
        const bilal = insertedMembers['6789012345678'];
        const usman = insertedMembers['8901234567890'];
        const adminUser = insertedMembers['1234567890123'];
        const samplePayments = [
            {
                num: 'PAY-2026-00001',
                mem: tariq,
                cnic: '4567890123456',
                date: '2026-01-10',
                amount: 5000.0,
                type: 'Membership Fee',
                method: 'Bank Transfer',
                ref: 'TXN-HBL-99281',
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00002',
                mem: tariq,
                cnic: '4567890123456',
                date: '2026-02-05',
                amount: 2500.0,
                type: 'Monthly Contribution',
                method: 'Cash',
                ref: null,
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00003',
                mem: zubair,
                cnic: '5678901234567',
                date: '2026-01-15',
                amount: 5000.0,
                type: 'Membership Fee',
                method: 'Bank Transfer',
                ref: 'TXN-MCB-11029',
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00004',
                mem: zubair,
                cnic: '5678901234567',
                date: '2026-02-12',
                amount: 2500.0,
                type: 'Monthly Contribution',
                method: 'Bank Transfer',
                ref: 'TXN-UBL-55421',
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00005',
                mem: bilal,
                cnic: '6789012345678',
                date: '2026-02-01',
                amount: 10000.0,
                type: 'Donation',
                method: 'Cash',
                ref: 'DON-REC-001',
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00006',
                mem: usman,
                cnic: '8901234567890',
                date: '2026-02-20',
                amount: 5000.0,
                type: 'Membership Fee',
                method: 'Bank Transfer',
                ref: 'TXN-MEEZAN-771',
                status: 'Posted',
            },
            {
                num: 'PAY-2026-00007',
                mem: bilal,
                cnic: '6789012345678',
                date: '2026-02-22',
                amount: 3000.0,
                type: 'Monthly Contribution',
                method: 'Cash',
                ref: null,
                status: 'Draft',
            },
        ];
        for (const p of samplePayments) {
            if (p.mem) {
                await (0, db_js_1.query)(`INSERT IGNORE INTO payments 
            (payment_number, member_id, member_cnic, member_name, payment_date, amount,
             payment_type, payment_method, reference_number, status, added_by, posted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`, [p.num, p.mem.memberProfileId, p.cnic, p.mem.name, p.date, p.amount, p.type, p.method, p.ref, p.status]);
            }
        }
        console.log('[INFO] Seeded sample payments.');
        // 3. Seed Welfare Support
        const sampleWelfare = [
            {
                num: 'WLF-2026-00001',
                mem: tariq,
                cnic: '4567890123456',
                date: '2026-01-20',
                amount: 15000.0,
                area: 'Medical Assistance',
                desc: 'Reimbursement for emergency outpatient medical hospitalization',
                method: 'Bank Transfer',
                ref: 'MED-REF-4412',
                status: 'Posted',
            },
            {
                num: 'WLF-2026-00002',
                mem: zubair,
                cnic: '5678901234567',
                date: '2026-02-10',
                amount: 20000.0,
                area: 'Family Support',
                desc: 'Special family bereavement and welfare subsistence stipend',
                method: 'Cash',
                ref: null,
                status: 'Posted',
            },
            {
                num: 'WLF-2026-00003',
                mem: bilal,
                cnic: '6789012345678',
                date: '2026-02-18',
                amount: 12000.0,
                area: 'Education',
                desc: 'Children higher secondary annual academic scholarship aid',
                method: 'Bank Transfer',
                ref: 'EDU-AID-991',
                status: 'Posted',
            },
        ];
        for (const w of sampleWelfare) {
            if (w.mem) {
                await (0, db_js_1.query)(`INSERT IGNORE INTO welfare_support 
            (support_number, member_id, member_cnic, member_name, payment_date, amount,
             support_area, description, payment_method, reference_number, status, added_by, posted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`, [w.num, w.mem.memberProfileId, w.cnic, w.mem.name, w.date, w.amount, w.area, w.desc, w.method, w.ref, w.status]);
            }
        }
        console.log('[INFO] Seeded sample welfare assistance records.');
        // 4. Seed Member-to-Member Transfers (Record-Only)
        const sampleTransfers = [
            {
                num: 'TRF-2026-00001',
                date: '2026-01-25',
                sId: tariq.memberProfileId,
                sCnic: '4567890123456',
                sName: tariq.name,
                rId: zubair.memberProfileId,
                rCnic: '5678901234567',
                rName: zubair.name,
                amount: 4000.0,
                purpose: 'Mutual duty emergency travel advance',
                method: 'Cash',
                ref: 'MUT-019',
                status: 'Posted',
            },
            {
                num: 'TRF-2026-00002',
                date: '2026-02-14',
                sId: zubair.memberProfileId,
                sCnic: '5678901234567',
                sName: zubair.name,
                rId: bilal.memberProfileId,
                rCnic: '6789012345678',
                rName: bilal.name,
                amount: 7500.0,
                purpose: 'Peer friendly loan settlement recorded through liaison office',
                method: 'Bank Transfer',
                ref: 'TRF-BNK-8812',
                status: 'Posted',
            },
        ];
        for (const t of sampleTransfers) {
            await (0, db_js_1.query)(`INSERT IGNORE INTO fund_transfers 
          (transfer_number, transfer_date, sender_id, sender_cnic, sender_name,
           receiver_id, receiver_cnic, receiver_name, amount, transfer_purpose,
           payment_method, reference_number, status, added_by, posted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`, [t.num, t.date, t.sId, t.sCnic, t.sName, t.rId, t.rCnic, t.rName, t.amount, t.purpose, t.method, t.ref, t.status]);
        }
        console.log('[INFO] Seeded sample member-to-member transfers (Record-Only).');
        // 5. Seed Initial Audit Logs
        await (0, db_js_1.query)(`INSERT INTO audit_logs (actor_id, actor_role, action_type, entity_type, entity_id, reason, ip_address)
       VALUES (1, 'Super Admin', 'SYSTEM_SEED', 'SYSTEM', '1', 'Initial automated seed execution', '127.0.0.1')`);
        console.log('[SUCCESS] Database seeding completed successfully!');
    }
    catch (err) {
        console.error('[ERROR] Seeding error:', err);
        process.exit(1);
    }
    finally {
        await db_js_1.pool.end();
    }
}
seed();
