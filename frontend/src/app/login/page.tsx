'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

const loginFormSchema = z.object({
  cnic: z
    .string()
    .trim()
    .regex(/^\d{13}$/, 'CNIC must be exactly 13 numeric digits without hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      cnic: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const res = await login(data.cnic, data.password);
    if (!res.success) {
      setServerError(res.message || 'Invalid credentials or disabled account.');
    }
  };

  // Quick fill helper for testing
  const fillCredentials = (cnic: string, pass: string) => {
    setValue('cnic', cnic);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Institutional Crest / Emblem */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Institutional Management Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Membership, Payments, Welfare & Transfer Registry
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Account Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your verified 13-digit CNIC and password to sign in.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* CNIC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                CNIC Number (13 Digits)
              </label>
              <input
                type="text"
                maxLength={13}
                placeholder="e.g. 1234567890123"
                {...register('cnic')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-sans"
              />
              {errors.cnic && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.cnic.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2 font-semibold"
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Test Credentials:
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('1234567890123', 'AdminPassword123!')}
                className="px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] text-center transition-colors"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('2345678901234', 'FocalPassword123!')}
                className="px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] text-center transition-colors"
              >
                Focal Person
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('4567890123456', 'UserPassword123!')}
                className="px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] text-center transition-colors"
              >
                Regular User
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Session & Parameterized Institutional Security</span>
        </div>
      </div>
    </div>
  );
}
