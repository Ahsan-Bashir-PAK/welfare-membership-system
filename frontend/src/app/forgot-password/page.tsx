'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, Shield, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

const verifyStepSchema = z.object({
  cnic: z.string().trim().regex(/^\d{13}$/, 'CNIC must be exactly 13 digits without dashes'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be selected in YYYY-MM-DD format'),
});

const resetStepSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

type VerifyFormData = z.infer<typeof verifyStepSchema>;
type ResetFormData = z.infer<typeof resetStepSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [verifiedCnic, setVerifiedCnic] = useState<string>('');
  const [verifiedDob, setVerifiedDob] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form 1: Verify Identity
  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors, isSubmitting: isVerifying },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifyStepSchema),
    defaultValues: {
      cnic: '',
      dateOfBirth: '',
    },
  });

  // Form 2: Reset Password
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetStepSchema),
  });

  const onVerify = async (data: VerifyFormData) => {
    setErrorMsg(null);
    try {
      const res = await api.post('/auth/forgot-password/verify', data);
      if (res.data?.success) {
        setVerifiedCnic(data.cnic);
        setVerifiedDob(data.dateOfBirth);
        setStep('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'The provided CNIC and Date of Birth do not match our verified records.');
    }
  };

  const onReset = async (data: ResetFormData) => {
    setErrorMsg(null);
    try {
      const res = await api.post('/auth/forgot-password/reset', {
        cnic: verifiedCnic,
        dateOfBirth: verifiedDob,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      if (res.data?.success) {
        setStep('success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please verify your details again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Institutional Password Recovery
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Identity verification via CNIC and Date of Birth
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'verify' && (
            <div>
              <div className="border-b border-slate-100 pb-4 mb-5">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Step 1 of 2
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-1">
                  Verify Member Identity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered 13-digit CNIC and exact Date of Birth as recorded in the system.
                </p>
              </div>

              <form onSubmit={handleVerifySubmit(onVerify)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    13-Digit CNIC
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="e.g. 4567890123456"
                    {...registerVerify('cnic')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {verifyErrors.cnic && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {verifyErrors.cnic.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    {...registerVerify('dateOfBirth')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {verifyErrors.dateOfBirth && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {verifyErrors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isVerifying}
                  className="w-full mt-2"
                >
                  Verify Record
                </Button>
              </form>
            </div>
          )}

          {step === 'reset' && (
            <div>
              <div className="border-b border-slate-100 pb-4 mb-5">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Step 2 of 2 — Identity Confirmed
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-1">
                  Set New Secure Password
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your new password below (minimum 6 characters).
                </p>
              </div>

              <form onSubmit={handleResetSubmit(onReset)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    {...registerReset('newPassword')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {resetErrors.newPassword && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {resetErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    {...registerReset('confirmPassword')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {resetErrors.confirmPassword && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {resetErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isResetting}
                  className="w-full mt-2"
                >
                  Save New Password
                </Button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Password Reset Complete</h2>
              <p className="text-xs text-slate-600 mt-1.5 mb-6">
                Your credentials have been securely updated and previous sessions invalidated. You may now sign in using your new password.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Return to Login
              </Button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
