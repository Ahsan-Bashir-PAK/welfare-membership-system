import type { Request } from 'express';

export type UserRole = 'Super Admin' | 'Focal Person' | 'User';
export type UserStatus = 'Active' | 'Disable';
export type TransactionStatus = 'Draft' | 'Posted' | 'Reversed';

export interface AuthUser {
  id: number;
  cnic: string;
  role: UserRole;
  status: UserStatus;
  memberProfileId?: number;
  memberId?: string;
  name?: string;
  membershipStatus?: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
