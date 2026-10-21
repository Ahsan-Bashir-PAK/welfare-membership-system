# Institutional Management System — REST API Documentation

This document describes all REST API endpoints for the **Membership, Payments, Welfare & Transfer Management System**.

## Base URL
- Development: `http://localhost:5000/api`
- Next.js Proxy: `http://localhost:3000/api`

## Authentication & Session Management
All authenticated requests use an HTTP-only secure cookie named `auth_token` or an `Authorization: Bearer <token>` header.

### 1. Authentication Endpoints

#### `POST /auth/login`
Authenticates a member or administrator.
- **Rate Limit**: 20 requests per 15 minutes per IP.
- **Request Body**:
```json
{
  "cnic": "1234567890123",
  "password": "AdminPassword123!"
}
```
- **Validation**:
  - CNIC: Exactly 13 numeric digits, no hyphens.
  - Password: Min 6 characters.
- **Response**: `200 OK` with HTTP-only cookie and safe user profile.
- **Status Checks**:
  - Rejects disabled account (`status = 'Disable'`) with `403 Forbidden`.
  - Rejects disabled membership for regular users (`membership_status = 'Disable'`) with `403 Forbidden`.

#### `POST /auth/logout`
Terminates the session and clears the HTTP-only cookie.
- **Access**: Authenticated.
- **Response**: `200 OK` `{ "success": true, "message": "Logged out successfully" }`.

#### `GET /auth/me`
Retrieves current authenticated session details and member profile.
- **Access**: Authenticated.

#### `POST /auth/forgot-password/verify`
Step 1 of self-service password recovery.
- **Rate Limit**: 10 requests per 15 minutes per IP.
- **Request Body**:
```json
{
  "cnic": "4567890123456",
  "dateOfBirth": "1988-04-15"
}
```
- **Security**: Generic response on mismatch to prevent CNIC enumeration. Logged in `password_reset_logs`.

#### `POST /auth/forgot-password/reset`
Step 2 of self-service password recovery. Sets a new password after verification.
- **Request Body**:
```json
{
  "cnic": "4567890123456",
  "dateOfBirth": "1988-04-15",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

#### `POST /auth/change-password`
Changes current password for authenticated user.
- **Access**: Authenticated.

---

## 2. Member Management Endpoints

#### `GET /members`
Search and filter members with pagination.
- **Access**: Authenticated.
- **Scoping**:
  - Super Admin & Focal Person: View authorized members.
  - Regular User: Scoped strictly to own profile.
- **Query Parameters**:
  - `search`: Filter by CNIC, name, member ID.
  - `status`: `Active` or `Disable`.
  - `role`: `Super Admin`, `Focal Person`, `User`.
  - `rankId`, `zoneId`, `sectorId`, `beatId`.
  - `page` (default: 1), `limit` (default: 10).

#### `GET /members/:id`
Retrieves full member dossier including summary statistics (total payments, welfare, transfers).

#### `POST /members`
Registers a new member and creates their account credentials.
- **Access**: `Super Admin`, `Focal Person`.
- **Role Policy**:
  - Super Admin: Can set account role (`Super Admin`, `Focal Person`, `User`).
  - Focal Person: **Read-only role locked to 'User'**. Backend rejects or forces role to `User`.

#### `PUT /members/:id`
Updates member information. Focal Persons cannot modify account roles.

#### `PATCH /members/:id/status`
Updates status to `Active` or `Disable`.
- **Access**: `Super Admin`, `Focal Person`.
- **Integrity Rule**: Prevents disabling the last active Super Admin. Logs to `membership_status_history` and `audit_logs`.

#### `PATCH /members/:id/membership-date`
Updates effective membership date with audited justification.

#### `PATCH /members/:id/role`
Updates account role (`Super Admin`, `Focal Person`, `User`).
- **Access**: `Super Admin` only.
- **Integrity Rule**: Prevents demoting the last active Super Admin.

#### `DELETE /members/:id`
Guarded archival operation (`archived_at` timestamp).
- **Access**: `Super Admin` only.

---

## 3. Financial Endpoints

### A. Payment Collection

#### `GET /payments`
Lists payment records with filters (date range, type, method, status). Regular users only see their own payments.

#### `POST /payments`
Records money received from a member.
- **Access**: `Super Admin`, `Focal Person`.
- Auto-generates `PAY-YYYY-XXXXX`.
- Monetary amounts stored as `DECIMAL(14,2)`.

#### `POST /payments/:id/post`
Posts a draft payment voucher into final state.

#### `POST /payments/:id/reverse`
Audited payment reversal.
- **Access**: `Super Admin` only.
- Requires mandatory `reason` (min 5 characters).
- Preserves original record in history with `status = 'Reversed'`.

---

### B. Welfare Support

#### `GET /welfare`
Lists welfare disbursements. Regular users only see their own aid.

#### `POST /welfare`
Records approved welfare assistance.
- **Access**: `Super Admin`, `Focal Person`.
- Auto-generates `WLF-YYYY-XXXXX`.

#### `POST /welfare/:id/reverse`
Audited welfare reversal.
- **Access**: `Super Admin` only.

---

### C. Member-to-Member Transfers (Record-Only)

#### `GET /transfers`
Lists peer transfers. Regular users only view transfers involving them as sender or receiver.

#### `POST /transfers`
Records a peer transfer for historical institutional documentation.
- **Access**: `Super Admin`, `Focal Person`.
- Sender and receiver must both be existing members.
- `senderId !== receiverId`.
- Amount > 0.
- **Accounting Note**: Does NOT debit or credit member wallets. Does not affect organizational fund balance.

#### `POST /transfers/:id/reverse`
Audited reversal of a recorded transfer.
- **Access**: `Super Admin` only.

---

## 4. Dashboard & Reports Endpoints

#### `GET /dashboard/summary`
Calculates real-time counts and sums from database queries.

#### `GET /dashboard/charts`
Monthly time-series for payments, welfare, transfer volume, and category breakdowns.

#### `GET /reports/members` (`?exportFormat=excel`)
#### `GET /reports/payments` (`?exportFormat=excel`)
#### `GET /reports/welfare` (`?exportFormat=excel`)
#### `GET /reports/transfers` (`?exportFormat=excel`)
#### `GET /reports/organizational-fund`
Calculates fund balance strictly: Opening Balance + Posted Income - Posted Expenses - Posted Welfare. Shows `Not Configured` if uninitialized.

---

## 5. Administration & Audit Endpoints

#### `GET /audit-logs`
Super Admin protected audit trail with filter by action type, entity, actor, and date.

#### `GET /master-data`
#### `POST /master-data/ranks`, `/zones`, `/sectors`, `/beats`, `/support-areas`
Master data management (Super Admin only for mutations).

#### `GET /settings`
#### `PATCH /settings/:key`
System settings management (Super Admin only).
