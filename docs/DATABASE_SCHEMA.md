# Institutional Management System — Database Schema & Data Dictionary

Database: `membership_system_db`  
Engine: `InnoDB`  
Collation: `utf8mb4_unicode_ci`  

## Entity Relationship Overview
The system models institutional members, operational authentication credentials, master classification data, and three strictly distinguished financial registers.

### Tables
1. `users`: Stores authentication credentials, account roles (`Super Admin`, `Focal Person`, `User`), account status, and password change flags.
2. `member_profiles`: Comprehensive profile linked 1:1 with `users`, storing CNIC, official rank, posting, zone, sector, beat, contact details, date of birth, and membership date.
3. `ranks`, `zones`, `sectors`, `beats`: Hierarchical master data defining geographic and administrative jurisdictions.
4. `support_areas`: Humanitarian aid categories for welfare sanctions.
5. `membership_status_history`: Audited timeline of member status modifications with timestamps and administrator reasons.
6. `payments`: Record of funds received from members with auto-generated receipt numbers, monetary amounts (`DECIMAL(14,2)`), and transaction statuses (`Draft`, `Posted`, `Reversed`).
7. `welfare_support`: Record of welfare assistance paid out to members with voucher numbers and approval details.
8. `fund_transfers`: **Record-only** historical register documenting peer-to-peer transfers between members. No wallets or balance deductions.
9. `audit_logs`: Protected tamper-evident audit trail capturing actor, role, action, entity, JSON delta payloads, client IP, and justification.
10. `password_reset_logs`: Log of all password recovery verification attempts.
11. `system_settings`: Key-value configuration for organizational titles, currency symbols, and fund policies.

## Data Integrity & Constraints
- **CNIC Uniqueness**: Enforced via `UNIQUE` constraints on both `users(cnic)` and `member_profiles(cnic)`. Stored as `VARCHAR(13)` to preserve leading zeros.
- **Foreign Keys**: Cascading updates and restricted deletes protect referential integrity.
- **Monetary Types**: Stored as `DECIMAL(14,2)` to prevent floating-point inaccuracies.
- **Audit Logging**: Reversals preserve the original transaction in place with `reversed_at`, `reversed_by`, and `reversal_reason`.
