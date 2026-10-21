# Membership, Payments, Welfare & Transfer Management System

A production-ready, full-stack enterprise institutional management application designed to maintain centralized records of members, payment collections, humanitarian welfare disbursements, and historical member-to-member transfers.

---

## 🏛️ System Features & Highlights

- **Institutional Authentication**: Secure login using 13-digit CNIC and password with show/hide password control and session management via HTTP-only cookies.
- **Self-Service Password Recovery**: Two-step identity verification requiring 13-digit CNIC and Date of Birth (`YYYY-MM-DD`) with rate limiting and generic error messages to eliminate enumeration vulnerabilities.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Complete administrative governance, member management, role assignment, master data configuration, system settings, and audited transaction reversals. Protected against accidental demotion/removal of the last active Super Admin.
  - **Focal Person**: Operational field coordination. Can update member status (Active / Disable), adjust membership dates, record payments, sanction welfare, and log transfers. **Strictly locked from changing or assigning account roles**.
  - **Regular User**: Secure member portal with personal dossier view, personal payment receipts, approved welfare claims, and mutual transfer statements.
- **Record-Only Transfer Register**: Peer-to-peer transfers between members are maintained purely as a historical documentation register. **No member wallets, virtual ledger balances, or automatic deductions exist.**
- **Immutable Financial Ledgers & Audited Reversals**: Posted vouchers cannot be silently altered or deleted. Reversals preserve the original transaction in history, documenting the reversing administrator, timestamp, and mandatory justification.
- **Real-Time Dashboards & Recharts Visualizations**: Summary cards and graphs computed directly from active database records.
- **Reporting & Exports**: Filtered statements for members, payments, welfare, and transfers with instant Excel (.xlsx) downloads and print-friendly layouts.
- **Tamper-Evident Audit Trail**: Captures actor, role, action, entity, timestamp, client IP, and before/after JSON delta payloads.

---

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern Institutional Slate Palette
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Validation**: React Hook Form with Zod schemas
- **API Client**: Centralized Axios client with credentials support

### Backend
- **Runtime**: Node.js v22+
- **Framework**: Express.js with TypeScript
- **Database**: MySQL / MariaDB via `mysql2/promise` with connection pooling
- **Security**: Helmet, bcryptjs password hashing, JWT credentials in HTTP-only cookies, Express Rate Limit
- **Architecture**: RESTful, parameterized SQL queries (no ORM overhead)
- **Testing**: Vitest & Supertest automated suite

---

## 📂 Project Directory Structure

```text
membership-system/
├── backend/
│   ├── src/
│   │   ├── config/          # DB pool, environment config
│   │   ├── controllers/     # Auth, Member, Payment, Welfare, Transfer, Dashboard, Reports, Audit
│   │   ├── middleware/      # Auth JWT, Role RBAC, Rate limiter, Error handler
│   │   ├── routes/          # REST route handlers
│   │   ├── scripts/         # initAdmin.ts, seed.ts
│   │   ├── tests/           # Vitest automated test suite
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # Audit logger
│   │   ├── validators/      # Zod validation schemas
│   │   └── server.ts        # Express app entry point
│   ├── .env                 # Backend environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (login, forgot-password, dashboard, members, payments, welfare, transfers, reports, admin)
│   │   ├── components/      # Layout (Sidebar, Navbar, AppLayout), UI (Badge, Card, Modal, Button), Charts
│   │   └── lib/             # api.ts, auth-context.tsx, utils.ts
│   ├── .env.local           # Frontend environment variables
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── database/
│   ├── schema.sql           # Complete MySQL relational schema
│   └── seeds/
│       └── 01_master_data.sql # Initial ranks, zones, sectors, beats, support areas, settings
└── docs/
    ├── API_DOCUMENTATION.md # Comprehensive endpoint reference
    ├── DATABASE_SCHEMA.md   # Schema and data dictionary
    └── DEPLOYMENT_GUIDE.md  # Production PM2/Nginx deployment instructions
```

---

## 🔑 Pre-Configured Test Accounts

| Account Role | CNIC (13 Digits) | Password | Default Scope |
|---|---|---|---|
| **Super Admin** | `1234567890123` | `AdminPassword123!` | Full System & Governance Access |
| **Focal Person 1** | `2345678901234` | `FocalPassword123!` | North Zone Field Coordination |
| **Focal Person 2** | `3456789012345` | `FocalPassword123!` | South Zone Field Coordination |
| **Regular Member 1** | `4567890123456` | `UserPassword123!` | Personal Dossier & Claims |
| **Regular Member 2** | `5678901234567` | `UserPassword123!` | Personal Dossier & Claims |
| **Regular Member 3** | `6789012345678` | `UserPassword123!` | Personal Dossier & Claims |
| **Disabled Account** | `7890123456789` | `UserPassword123!` | Blocked with 403 Forbidden |

*Note: For self-service password recovery testing with CNIC `4567890123456`, the registered Date of Birth is `1988-04-15`.*

---

## 🚀 Quick Start Guide

### 1. Database Initialization
Ensure MySQL is running on port 3306, then apply the schema and seeds:
```powershell
Get-Content database/schema.sql -Raw | & "C:\xampp\mysql\bin\mysql.exe" -u root
Get-Content database/seeds/01_master_data.sql -Raw | & "C:\xampp\mysql\bin\mysql.exe" -u root
```

### 2. Backend Setup
```powershell
cd backend
npm install
npm run seed          # Populates test members, payments, welfare, and transfers
npm run dev           # Starts Express API at http://localhost:5000
```

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev           # Starts Next.js Portal at http://localhost:3000
```

### 4. Running Automated Tests
```powershell
cd backend
npm run test          # Executes all 18 automated integration tests via Vitest
```

---

## 📑 Documentation Links
- [API Documentation](file:///docs/API_DOCUMENTATION.md)
- [Database Schema & Data Dictionary](file:///docs/DATABASE_SCHEMA.md)
- [Production Deployment Guide](file:///docs/DEPLOYMENT_GUIDE.md)
