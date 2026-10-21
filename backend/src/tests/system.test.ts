import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { pool, query } from '../config/db.js';

let adminToken = '';
let focalToken = '';
let userToken = '';

let testMember1Id: number;
let testMember2Id: number;
let testPaymentId: number;
let testWelfareId: number;
let testTransferId: number;

beforeAll(async () => {
  // Login as Super Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ cnic: '1234567890123', password: 'AdminPassword123!' });
  adminToken = adminRes.body.token;

  // Login as Focal Person
  const focalRes = await request(app)
    .post('/api/auth/login')
    .send({ cnic: '2345678901234', password: 'FocalPassword123!' });
  focalToken = focalRes.body.token;

  // Login as Regular Member
  const userRes = await request(app)
    .post('/api/auth/login')
    .send({ cnic: '4567890123456', password: 'UserPassword123!' });
  userToken = userRes.body.token;

  // Fetch test members
  const members = await query<any[]>('SELECT id FROM member_profiles WHERE archived_at IS NULL LIMIT 2');
  testMember1Id = members[0].id;
  testMember2Id = members[1].id;
});

afterAll(async () => {
  await pool.end();
});

describe('1. Authentication, Password Verification & CNIC Rules', () => {
  it('Should reject invalid CNIC formatting (not 13 digits)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ cnic: '12345', password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Should reject wrong password with generic error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ cnic: '1234567890123', password: 'WrongPassword999!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Should reject disabled accounts with 403', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ cnic: '7890123456789', password: 'UserPassword123!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('disabled');
  });

  it('Should successfully authenticate valid Super Admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ cnic: '1234567890123', password: 'AdminPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('Super Admin');
    expect(res.body.token).toBeDefined();
  });

  it('Forgot password: verify with correct DOB succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password/verify')
      .send({ cnic: '4567890123456', dateOfBirth: '1988-04-15' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Forgot password: verify with wrong DOB returns generic 400', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password/verify')
      .send({ cnic: '4567890123456', dateOfBirth: '1999-12-31' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Role-Based Access Control & Focal Person Restrictions', () => {
  it('Focal Person cannot assign role other than User when registering member', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${focalToken}`)
      .send({
        cnic: '9999999999999',
        name: 'Attempted Admin',
        fatherName: 'Test Father',
        rankName: 'Constable',
        posting: 'Station A',
        address: '123 Test St',
        zoneName: 'Central Zone',
        sectorName: 'Sector Central Core',
        beatName: 'Beat 08 - Secretariat Zone',
        contact: '03001112233',
        dateOfBirth: '1990-01-01',
        membershipDate: '2025-01-01',
        status: 'Active',
        accountRole: 'Super Admin', // Attempting privilege escalation
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Focal Person cannot access Super Admin-only audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${focalToken}`);
    expect(res.status).toBe(403);
  });

  it('Regular User cannot access full member directory', async () => {
    const res = await request(app)
      .get('/api/members')
      .set('Authorization', `Bearer ${userToken}`);
    // Scoped to self only
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });

  it('Regular User cannot record financial payments', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        memberId: testMember1Id,
        paymentDate: '2026-02-01',
        amount: 1000,
        paymentType: 'Monthly Contribution',
        paymentMethod: 'Cash',
      });
    expect(res.status).toBe(403);
  });

  it('Focal Person cannot reverse posted payments (Super Admin only)', async () => {
    const res = await request(app)
      .post('/api/payments/1/reverse')
      .set('Authorization', `Bearer ${focalToken}`)
      .send({ reason: 'Attempted reversal by focal person' });
    expect(res.status).toBe(403);
  });
});

describe('3. Financial Modules: Payments, Welfare, and Record-Only Transfers', () => {
  it('Super Admin / Focal Person can record payment and auto-generate ID', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        memberId: testMember1Id,
        paymentDate: '2026-02-15',
        amount: 4500.0,
        paymentType: 'Membership Fee',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'TEST-TXN-001',
        status: 'Posted',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentNumber).toMatch(/^PAY-\d{4}-\d{5}$/);
    testPaymentId = res.body.data.id;
  });

  it('Audited Payment Reversal preserves record and updates status', async () => {
    const res = await request(app)
      .post(`/api/payments/${testPaymentId}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Duplicate test receipt entry reversed by audit' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify status in DB is Reversed and preserved
    const [p]: any = await query('SELECT status, reversed_at, reversal_reason FROM payments WHERE id = ?', [testPaymentId]);
    expect(p.status).toBe('Reversed');
    expect(p.reversed_at).not.toBeNull();
    expect(p.reversal_reason).toContain('Duplicate test receipt');
  });

  it('Sanctioning welfare assistance creates valid voucher', async () => {
    const res = await request(app)
      .post('/api/welfare')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        memberId: testMember1Id,
        paymentDate: '2026-02-16',
        amount: 8000.0,
        supportArea: 'Emergency Assistance',
        description: 'Temporary accident emergency relief sanction',
        paymentMethod: 'Bank Transfer',
        status: 'Posted',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.supportNumber).toMatch(/^WLF-\d{4}-\d{5}$/);
    testWelfareId = res.body.data.id;
  });

  it('Member-to-Member transfer rejects sender === receiver', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        senderId: testMember1Id,
        receiverId: testMember1Id, // Same member
        transferDate: '2026-02-17',
        amount: 2000.0,
        transferPurpose: 'Self transfer test',
        paymentMethod: 'Cash',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('same');
  });

  it('Member-to-Member transfer records successfully as record-only transaction', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        senderId: testMember1Id,
        receiverId: testMember2Id,
        transferDate: '2026-02-17',
        amount: 3500.0,
        transferPurpose: 'Field duty peer travel reimbursement advance',
        paymentMethod: 'Cash',
        status: 'Posted',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.transferNumber).toMatch(/^TRF-\d{4}-\d{5}$/);
  });
});

describe('4. Dashboard Summary & Strict Accounting Calculations', () => {
  it('Dashboard returns real statistics from database', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.membership.total).toBeGreaterThan(0);
    expect(res.body.data.payments.total).toBeGreaterThan(0);
    expect(res.body.data.transfers.isRecordOnly).toBe(true);
    expect(res.body.data.organizationalFund.status).toBeDefined();
  });

  it('Organizational Fund report reflects Not Configured or audited balance without peer transfers', async () => {
    const res = await request(app)
      .get('/api/reports/organizational-fund')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // Either Not Configured or Active without fabricated numbers
    expect(['Not Configured', 'Active']).toContain(res.body.status);
  });
});

describe('5. Master Institutional Reference Data & Deletion Functionality', () => {
  it('Includes requested zones Motorway North and MC-I', async () => {
    const res = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const zoneNames = res.body.data.zones.map((z: any) => z.name);
    expect(zoneNames).toContain('Motorway North');
    expect(zoneNames).toContain('MC-I');
  });

  it('Super Admin can add and delete an authorized Rank', async () => {
    // 1. Add rank
    const addRes = await request(app)
      .post('/api/master-data/ranks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Rank Temp', description: 'Temporary test rank' });
    expect(addRes.status).toBe(201);

    // Fetch master data to find ID
    const getRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    const added = getRes.body.data.ranks.find((r: any) => r.name === 'Test Rank Temp');
    expect(added).toBeDefined();

    // 2. Focal person cannot delete rank
    const forbidRes = await request(app)
      .delete(`/api/master-data/ranks/${added.id}`)
      .set('Authorization', `Bearer ${focalToken}`);
    expect(forbidRes.status).toBe(403);

    // 3. Super admin can delete rank
    const delRes = await request(app)
      .delete(`/api/master-data/ranks/${added.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('Super Admin can add and delete an authorized Welfare Category', async () => {
    // 1. Add
    const addRes = await request(app)
      .post('/api/master-data/support-areas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Temporary Relief Test', description: 'Test category' });
    expect(addRes.status).toBe(201);

    const getRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    const added = getRes.body.data.supportAreas.find((s: any) => s.name === 'Temporary Relief Test');
    expect(added).toBeDefined();

    // 2. Delete
    const delRes = await request(app)
      .delete(`/api/master-data/support-areas/${added.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('Super Admin can cascade delete an administrative Zone with Sector and Beat', async () => {
    // 1. Add Zone
    await request(app)
      .post('/api/master-data/zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Temp Test Zone', code: 'TTZ-99' });

    let masterRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    const tempZone = masterRes.body.data.zones.find((z: any) => z.code === 'TTZ-99');
    expect(tempZone).toBeDefined();

    // 2. Add Sector under Temp Zone
    await request(app)
      .post('/api/master-data/sectors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId: tempZone.id, name: 'Temp Sector 99', code: 'TSEC-99' });

    masterRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    const tempSector = masterRes.body.data.sectors.find((s: any) => s.code === 'TSEC-99');
    expect(tempSector).toBeDefined();

    // 3. Add Beat under Temp Sector
    await request(app)
      .post('/api/master-data/beats')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sectorId: tempSector.id, name: 'Temp Beat 99', code: 'TBT-99' });

    masterRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    const tempBeat = masterRes.body.data.beats.find((b: any) => b.code === 'TBT-99');
    expect(tempBeat).toBeDefined();

    // 4. Delete the zone - should safely remove zone and child sector/beats
    const delRes = await request(app)
      .delete(`/api/master-data/zones/${tempZone.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify all 3 are gone
    const verifyRes = await request(app)
      .get('/api/master-data')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(verifyRes.body.data.zones.find((z: any) => z.id === tempZone.id)).toBeUndefined();
    expect(verifyRes.body.data.sectors.find((s: any) => s.id === tempSector.id)).toBeUndefined();
    expect(verifyRes.body.data.beats.find((b: any) => b.id === tempBeat.id)).toBeUndefined();
  });
});

