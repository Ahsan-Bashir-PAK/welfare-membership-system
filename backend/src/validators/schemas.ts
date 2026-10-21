import { z } from 'zod';

export const cnicRegex = /^\d{13}$/;

export const loginSchema = z.object({
  cnic: z
    .string()
    .trim()
    .regex(cnicRegex, 'CNIC must be exactly 13 digits with no dashes or spaces'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordVerifySchema = z.object({
  cnic: z.string().trim().regex(cnicRegex, 'CNIC must be exactly 13 digits'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
});

export const forgotPasswordResetSchema = z
  .object({
    cnic: z.string().trim().regex(cnicRegex, 'CNIC must be exactly 13 digits'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

export const createMemberSchema = z.object({
  cnic: z.string().trim().regex(cnicRegex, 'CNIC must be exactly 13 digits'),
  name: z.string().trim().min(2, 'Full Name is required'),
  fatherName: z.string().trim().min(2, 'Father Name is required'),
  rankId: z.number().int().positive().optional().nullable(),
  rankName: z.string().trim().min(1, 'Rank is required'),
  posting: z.string().trim().min(1, 'Posting location is required'),
  address: z.string().trim().min(3, 'Address is required'),
  zoneId: z.number().int().positive().optional().nullable(),
  zoneName: z.string().trim().min(1, 'Zone is required'),
  sectorId: z.number().int().positive().optional().nullable(),
  sectorName: z.string().trim().min(1, 'Sector is required'),
  beatId: z.number().int().positive().optional().nullable(),
  beatName: z.string().trim().min(1, 'Beat is required'),
  contact: z.string().trim().min(7, 'Contact number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
  membershipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Membership Date must be in YYYY-MM-DD format'),
  status: z.enum(['Active', 'Disable']).default('Active'),
  accountRole: z.enum(['Super Admin', 'Focal Person', 'User']).default('User'),
  password: z.string().min(6, 'Initial password must be at least 6 characters').optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().trim().min(2, 'Full Name is required').optional(),
  fatherName: z.string().trim().min(2, 'Father Name is required').optional(),
  rankId: z.number().int().positive().optional().nullable(),
  rankName: z.string().trim().min(1, 'Rank is required').optional(),
  posting: z.string().trim().min(1, 'Posting is required').optional(),
  address: z.string().trim().min(3, 'Address is required').optional(),
  zoneId: z.number().int().positive().optional().nullable(),
  zoneName: z.string().trim().min(1, 'Zone is required').optional(),
  sectorId: z.number().int().positive().optional().nullable(),
  sectorName: z.string().trim().min(1, 'Sector is required').optional(),
  beatId: z.number().int().positive().optional().nullable(),
  beatName: z.string().trim().min(1, 'Beat is required').optional(),
  contact: z.string().trim().min(7, 'Contact number is required').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  membershipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['Active', 'Disable']).optional(),
  accountRole: z.enum(['Super Admin', 'Focal Person', 'User']).optional(),
});

export const createPaymentSchema = z.object({
  memberId: z.number().int().positive('Valid Member is required'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment Date must be YYYY-MM-DD'),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentType: z.enum(['Membership Fee', 'Monthly Contribution', 'Donation', 'Other']),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['Draft', 'Posted']).default('Posted'),
});

export const createWelfareSchema = z.object({
  memberId: z.number().int().positive('Valid Member is required'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment Date must be YYYY-MM-DD'),
  amount: z.number().positive('Amount must be greater than zero'),
  supportAreaId: z.number().int().positive().optional().nullable(),
  supportArea: z.string().trim().min(1, 'Support Area is required'),
  description: z.string().trim().min(3, 'Description / Remarks is required'),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  status: z.enum(['Draft', 'Posted']).default('Posted'),
});

export const createTransferSchema = z
  .object({
    senderId: z.number().int().positive('Sender Member is required'),
    receiverId: z.number().int().positive('Receiver Member is required'),
    transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transfer Date must be YYYY-MM-DD'),
    amount: z.number().positive('Amount must be greater than zero'),
    transferPurpose: z.string().trim().min(2, 'Transfer Purpose is required'),
    paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
    referenceNumber: z.string().trim().max(100).optional().nullable(),
    remarks: z.string().trim().max(500).optional().nullable(),
    status: z.enum(['Draft', 'Posted']).default('Posted'),
  })
  .refine((data) => data.senderId !== data.receiverId, {
    message: 'Sender and Receiver cannot be the same member',
    path: ['receiverId'],
  });

export const reversalSchema = z.object({
  reason: z.string().trim().min(5, 'A clear reason for reversal is required (minimum 5 characters)'),
});
