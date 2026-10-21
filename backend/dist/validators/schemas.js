"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reversalSchema = exports.createTransferSchema = exports.createWelfareSchema = exports.createPaymentSchema = exports.updateMemberSchema = exports.createMemberSchema = exports.changePasswordSchema = exports.forgotPasswordResetSchema = exports.forgotPasswordVerifySchema = exports.loginSchema = exports.cnicRegex = void 0;
const zod_1 = require("zod");
exports.cnicRegex = /^\d{13}$/;
exports.loginSchema = zod_1.z.object({
    cnic: zod_1.z
        .string()
        .trim()
        .regex(exports.cnicRegex, 'CNIC must be exactly 13 digits with no dashes or spaces'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.forgotPasswordVerifySchema = zod_1.z.object({
    cnic: zod_1.z.string().trim().regex(exports.cnicRegex, 'CNIC must be exactly 13 digits'),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
});
exports.forgotPasswordResetSchema = zod_1.z
    .object({
    cnic: zod_1.z.string().trim().regex(exports.cnicRegex, 'CNIC must be exactly 13 digits'),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: zod_1.z.string().min(6, 'Password confirmation is required'),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
});
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: zod_1.z.string().min(6, 'Password confirmation is required'),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
});
exports.createMemberSchema = zod_1.z.object({
    cnic: zod_1.z.string().trim().regex(exports.cnicRegex, 'CNIC must be exactly 13 digits'),
    name: zod_1.z.string().trim().min(2, 'Full Name is required'),
    fatherName: zod_1.z.string().trim().min(2, 'Father Name is required'),
    rankId: zod_1.z.number().int().positive().optional().nullable(),
    rankName: zod_1.z.string().trim().min(1, 'Rank is required'),
    posting: zod_1.z.string().trim().min(1, 'Posting location is required'),
    address: zod_1.z.string().trim().min(3, 'Address is required'),
    zoneId: zod_1.z.number().int().positive().optional().nullable(),
    zoneName: zod_1.z.string().trim().min(1, 'Zone is required'),
    sectorId: zod_1.z.number().int().positive().optional().nullable(),
    sectorName: zod_1.z.string().trim().min(1, 'Sector is required'),
    beatId: zod_1.z.number().int().positive().optional().nullable(),
    beatName: zod_1.z.string().trim().min(1, 'Beat is required'),
    contact: zod_1.z.string().trim().min(7, 'Contact number is required'),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    membershipDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Membership Date must be in YYYY-MM-DD format'),
    status: zod_1.z.enum(['Active', 'Disable']).default('Active'),
    accountRole: zod_1.z.enum(['Super Admin', 'Focal Person', 'User']).default('User'),
    password: zod_1.z.string().min(6, 'Initial password must be at least 6 characters').optional(),
});
exports.updateMemberSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Full Name is required').optional(),
    fatherName: zod_1.z.string().trim().min(2, 'Father Name is required').optional(),
    rankId: zod_1.z.number().int().positive().optional().nullable(),
    rankName: zod_1.z.string().trim().min(1, 'Rank is required').optional(),
    posting: zod_1.z.string().trim().min(1, 'Posting is required').optional(),
    address: zod_1.z.string().trim().min(3, 'Address is required').optional(),
    zoneId: zod_1.z.number().int().positive().optional().nullable(),
    zoneName: zod_1.z.string().trim().min(1, 'Zone is required').optional(),
    sectorId: zod_1.z.number().int().positive().optional().nullable(),
    sectorName: zod_1.z.string().trim().min(1, 'Sector is required').optional(),
    beatId: zod_1.z.number().int().positive().optional().nullable(),
    beatName: zod_1.z.string().trim().min(1, 'Beat is required').optional(),
    contact: zod_1.z.string().trim().min(7, 'Contact number is required').optional(),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    membershipDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: zod_1.z.enum(['Active', 'Disable']).optional(),
    accountRole: zod_1.z.enum(['Super Admin', 'Focal Person', 'User']).optional(),
});
exports.createPaymentSchema = zod_1.z.object({
    memberId: zod_1.z.number().int().positive('Valid Member is required'),
    paymentDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment Date must be YYYY-MM-DD'),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    paymentType: zod_1.z.enum(['Membership Fee', 'Monthly Contribution', 'Donation', 'Other']),
    paymentMethod: zod_1.z.enum(['Cash', 'Bank Transfer', 'Other']),
    referenceNumber: zod_1.z.string().trim().max(100).optional().nullable(),
    remarks: zod_1.z.string().trim().max(500).optional().nullable(),
    status: zod_1.z.enum(['Draft', 'Posted']).default('Posted'),
});
exports.createWelfareSchema = zod_1.z.object({
    memberId: zod_1.z.number().int().positive('Valid Member is required'),
    paymentDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment Date must be YYYY-MM-DD'),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    supportAreaId: zod_1.z.number().int().positive().optional().nullable(),
    supportArea: zod_1.z.string().trim().min(1, 'Support Area is required'),
    description: zod_1.z.string().trim().min(3, 'Description / Remarks is required'),
    paymentMethod: zod_1.z.enum(['Cash', 'Bank Transfer', 'Other']),
    referenceNumber: zod_1.z.string().trim().max(100).optional().nullable(),
    status: zod_1.z.enum(['Draft', 'Posted']).default('Posted'),
});
exports.createTransferSchema = zod_1.z
    .object({
    senderId: zod_1.z.number().int().positive('Sender Member is required'),
    receiverId: zod_1.z.number().int().positive('Receiver Member is required'),
    transferDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transfer Date must be YYYY-MM-DD'),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    transferPurpose: zod_1.z.string().trim().min(2, 'Transfer Purpose is required'),
    paymentMethod: zod_1.z.enum(['Cash', 'Bank Transfer', 'Other']),
    referenceNumber: zod_1.z.string().trim().max(100).optional().nullable(),
    remarks: zod_1.z.string().trim().max(500).optional().nullable(),
    status: zod_1.z.enum(['Draft', 'Posted']).default('Posted'),
})
    .refine((data) => data.senderId !== data.receiverId, {
    message: 'Sender and Receiver cannot be the same member',
    path: ['receiverId'],
});
exports.reversalSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5, 'A clear reason for reversal is required (minimum 5 characters)'),
});
