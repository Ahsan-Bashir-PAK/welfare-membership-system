'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HeartHandshake, ArrowLeft, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

const welfareFormSchema = z.object({
  memberId: z.number().int().positive('Please select a verified member'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  supportArea: z.string().trim().min(1, 'Please select a Support Area'),
  description: z.string().trim().min(5, 'Detailed description or justification required (min 5 chars)'),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  status: z.enum(['Draft', 'Posted']),
});

type WelfareFormData = z.infer<typeof welfareFormSchema>;

function AddWelfareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get('memberId');

  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [supportAreas, setSupportAreas] = useState<any[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WelfareFormData>({
    resolver: zodResolver(welfareFormSchema),
    defaultValues: {
      memberId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      supportArea: 'Medical Assistance',
      description: '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      status: 'Posted',
    },
  });

  useEffect(() => {
    async function loadMaster() {
      try {
        const res = await api.get('/master-data');
        if (res.data?.success) {
          setSupportAreas(res.data.data.supportAreas || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMaster();
  }, []);

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

  const onSubmit = async (data: WelfareFormData) => {
    setServerError(null);
    setSuccessMsg(null);
    const matchedArea = supportAreas.find((a) => a.name === data.supportArea);
    const payload = {
      ...data,
      supportAreaId: matchedArea ? matchedArea.id : null,
    };

    try {
      const res = await api.post('/welfare', payload);
      if (res.data?.success) {
        setSuccessMsg(`Welfare assistance recorded! Voucher No: ${res.data.data.supportNumber}`);
        setTimeout(() => {
          router.push('/welfare');
        }, 1500);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to record welfare assistance');
    }
  };

  return (
    <AppLayout title="Add Welfare Support Record">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/welfare"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Welfare Register</span>
          </Link>
        </div>

        <Card>
          <CardHeader
            title="Record Welfare Assistance Disbursement"
            subtitle="Authorizes medical grants, family subsistence, and humanitarian relief aid."
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
              {/* Member Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Beneficiary Member <span className="text-rose-500">*</span>
                </label>

                {selectedMember ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
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
                      Change Beneficiary
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search member by CNIC or Name..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                    />

                    {members.length > 0 && memberSearch.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMember(m)}
                            className="p-3 hover:bg-emerald-50/60 cursor-pointer transition-colors text-xs flex items-center justify-between"
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

              {/* Welfare Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disbursement Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('paymentDate')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.paymentDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.paymentDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aid Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15000"
                    {...register('amount')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Support Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('supportArea')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {supportAreas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Voucher No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MED-APPR-441"
                    {...register('referenceNumber')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Voucher Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Posted">Posted (Final disbursed voucher)</option>
                    <option value="Draft">Draft (Pending approval)</option>
                  </select>
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sanction Justification / Relief Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide clinical diagnosis, family circumstance, or crisis documentation details..."
                  {...register('description')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/welfare')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Sanction Welfare Disbursement</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function AddWelfarePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AddWelfareContent />
    </Suspense>
  );
}
