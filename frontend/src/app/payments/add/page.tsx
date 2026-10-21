'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, ArrowLeft, Search, UserCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const paymentFormSchema = z.object({
  memberId: z.number().int().positive('Please select a verified member'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentType: z.enum(['Membership Fee', 'Monthly Contribution', 'Donation', 'Other']),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['Draft', 'Posted']),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

function AddPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get('memberId');

  const { isRegularUser } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      memberId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentType: 'Monthly Contribution',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      remarks: '',
      status: 'Posted',
    },
  });

  // Search members for autocomplete
  useEffect(() => {
    async function searchMembers() {
      if (!memberSearch.trim()) return;
      try {
        const res = await api.get('/members', { params: { search: memberSearch, limit: 8 } });
        if (res.data?.success) {
          setMembers(res.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    const timer = setTimeout(searchMembers, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // If memberId passed in query
  useEffect(() => {
    if (initialMemberId) {
      api.get(`/members/${initialMemberId}`).then((res) => {
        if (res.data?.success && res.data.member) {
          handleSelectMember(res.data.member);
        }
      });
    }
  }, [initialMemberId]);

  const handleSelectMember = (member: any) => {
    setSelectedMember(member);
    setValue('memberId', member.id);
    setMemberSearch('');
  };

  const onSubmit = async (data: PaymentFormData) => {
    setServerError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/payments', data);
      if (res.data?.success) {
        setSuccessMsg(`Payment recorded successfully! Voucher No: ${res.data.data.paymentNumber}`);
        setTimeout(() => {
          router.push('/payments');
        }, 1500);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to record payment');
    }
  };

  return (
    <AppLayout title="Record Member Payment">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Payment Register</span>
          </Link>
        </div>

        <Card>
          <CardHeader
            title="Record New Payment Collection"
            subtitle="Collect and post membership fees, contributions, and verified donations."
          />
          <CardBody className="p-6">
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Member Selection Searchable Autocomplete */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Member <span className="text-rose-500">*</span>
                </label>

                {selectedMember ? (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{selectedMember.name}</span>
                        <Badge variant="active">{selectedMember.membership_status || 'Active'}</Badge>
                      </div>
                      <p className="text-xs font-mono text-slate-600 mt-0.5">
                        CNIC: {selectedMember.cnic} &bull; ID: {selectedMember.member_id}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedMember.rank_name} &bull; {selectedMember.posting}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(null);
                        setValue('memberId', 0);
                      }}
                    >
                      Change Member
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type CNIC, Name, or Member ID to search..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />

                    {members.length > 0 && memberSearch.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMember(m)}
                            className="p-3 hover:bg-blue-50/60 cursor-pointer transition-colors text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{m.name}</p>
                              <p className="font-mono text-[11px] text-slate-500">
                                CNIC: {m.cnic} &bull; {m.member_id}
                              </p>
                            </div>
                            <span className="text-[11px] text-slate-400">{m.rank_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {errors.memberId && (
                  <p className="text-xs text-rose-600 mt-1">{errors.memberId.message}</p>
                )}
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('paymentDate')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.paymentDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.paymentDate.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    {...register('amount')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Posted">Posted (Final receipt voucher)</option>
                    <option value="Draft">Draft (Preliminary voucher)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('paymentType')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Membership Fee">Membership Fee</option>
                    <option value="Monthly Contribution">Monthly Contribution</option>
                    <option value="Donation">Donation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Slip No (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-HBL-99210"
                    {...register('referenceNumber')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional memo or transaction note..."
                  {...register('remarks')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/payments')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Post Payment Record</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function AddPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AddPaymentContent />
    </Suspense>
  );
}
