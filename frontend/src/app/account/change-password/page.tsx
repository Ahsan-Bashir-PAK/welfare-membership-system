'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setServerError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/auth/change-password', data);
      if (res.data?.success) {
        setSuccessMsg('Your password has been securely updated.');
        reset();
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to update password');
    }
  };

  return (
    <AppLayout title="Security & Password Change">
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <span>Change Account Password</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your authentication credentials. Keep your access key confidential.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Password Update Form"
            subtitle="Enter your current verified password followed by your new password."
          />
          <CardBody className="p-6">
            {serverError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  {...register('currentPassword')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                {errors.currentPassword && (
                  <p className="text-rose-600 mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register('newPassword')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                {errors.newPassword && (
                  <p className="text-rose-600 mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  {...register('confirmPassword')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                {errors.confirmPassword && (
                  <p className="text-rose-600 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="primary" size="md" loading={isSubmitting}>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
