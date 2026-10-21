'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftRight, ArrowLeft, Search, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

const transferFormSchema = z
  .object({
    senderId: z.number().int().positive('Please select the Sender member'),
    receiverId: z.number().int().positive('Please select the Receiver member'),
    transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date required'),
    amount: z.coerce.number().positive('Amount must be greater than zero'),
    transferPurpose: z.string().trim().min(3, 'Transfer purpose is required (min 3 chars)'),
    paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Other']),
    referenceNumber: z.string().trim().max(100).optional().nullable(),
    remarks: z.string().trim().max(500).optional().nullable(),
    status: z.enum(['Draft', 'Posted']),
  })
  .refine((data) => data.senderId !== data.receiverId, {
    message: 'Sender and Receiver cannot be the same member',
    path: ['receiverId'],
  });

type TransferFormData = z.infer<typeof transferFormSchema>;

export default function AddTransferPage() {
  const router = useRouter();

  // Search states for sender and receiver
  const [senderSearch, setSenderSearch] = useState('');
  const [senderResults, setSenderResults] = useState<any[]>([]);
  const [selectedSender, setSelectedSender] = useState<any | null>(null);

  const [receiverSearch, setReceiverSearch] = useState('');
  const [receiverResults, setReceiverResults] = useState<any[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<any | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      senderId: 0,
      receiverId: 0,
      transferDate: new Date().toISOString().split('T')[0],
      amount: 0,
      transferPurpose: '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      remarks: '',
      status: 'Posted',
    },
  });

  // Sender Search Autocomplete
  useEffect(() => {
    async function searchSender() {
      if (!senderSearch.trim()) return;
      try {
        const res = await api.get('/members', { params: { search: senderSearch, limit: 6 } });
        if (res.data?.success) setSenderResults(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
    const t = setTimeout(searchSender, 300);
    return () => clearTimeout(t);
  }, [senderSearch]);

  // Receiver Search Autocomplete
  useEffect(() => {
    async function searchReceiver() {
      if (!receiverSearch.trim()) return;
      try {
        const res = await api.get('/members', { params: { search: receiverSearch, limit: 6 } });
        if (res.data?.success) setReceiverResults(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
    const t = setTimeout(searchReceiver, 300);
    return () => clearTimeout(t);
  }, [receiverSearch]);

  const handleSelectSender = (m: any) => {
    setSelectedSender(m);
    setValue('senderId', m.id);
    setSenderSearch('');
  };

  const handleSelectReceiver = (m: any) => {
    setSelectedReceiver(m);
    setValue('receiverId', m.id);
    setReceiverSearch('');
  };

  const onSubmit = async (data: TransferFormData) => {
    setServerError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/transfers', data);
      if (res.data?.success) {
        setSuccessMsg(`Transfer registered successfully! Register ID: ${res.data.data.transferNumber}`);
        setTimeout(() => {
          router.push('/transfers');
        }, 1500);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to record transfer');
    }
  };

  return (
    <AppLayout title="Record Member Transfer">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/transfers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transfer Register</span>
          </Link>
        </div>

        {/* Policy Notice */}
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            <strong>Record-Only Accounting:</strong> This form registers an external mutual transfer for historical documentation. No virtual balances are debited or credited.
          </span>
        </div>

        <Card>
          <CardHeader
            title="Register Member-to-Member Transfer"
            subtitle="Document peer mutual assistance and travel transfers between members."
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
              {/* Sender & Receiver Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Sender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Sender (Originator) <span className="text-rose-500">*</span>
                  </label>

                  {selectedSender ? (
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{selectedSender.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {selectedSender.cnic} &bull; {selectedSender.member_id}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSender(null);
                          setValue('senderId', 0);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search sender by CNIC / Name..."
                        value={senderSearch}
                        onChange={(e) => setSenderSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                      />
                      {senderResults.length > 0 && senderSearch.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {senderResults.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => handleSelectSender(m)}
                              className="p-2.5 hover:bg-purple-50/60 cursor-pointer text-xs"
                            >
                              <p className="font-semibold text-slate-900">{m.name}</p>
                              <p className="font-mono text-[10px] text-slate-500">
                                CNIC: {m.cnic} &bull; {m.member_id}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {errors.senderId && (
                    <p className="text-xs text-rose-600 mt-1">{errors.senderId.message}</p>
                  )}
                </div>

                {/* 2. Receiver */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Receiver (Beneficiary) <span className="text-rose-500">*</span>
                  </label>

                  {selectedReceiver ? (
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{selectedReceiver.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {selectedReceiver.cnic} &bull; {selectedReceiver.member_id}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReceiver(null);
                          setValue('receiverId', 0);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search receiver by CNIC / Name..."
                        value={receiverSearch}
                        onChange={(e) => setReceiverSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                      />
                      {receiverResults.length > 0 && receiverSearch.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {receiverResults.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => handleSelectReceiver(m)}
                              className="p-2.5 hover:bg-purple-50/60 cursor-pointer text-xs"
                            >
                              <p className="font-semibold text-slate-900">{m.name}</p>
                              <p className="font-mono text-[10px] text-slate-500">
                                CNIC: {m.cnic} &bull; {m.member_id}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {errors.receiverId && (
                    <p className="text-xs text-rose-600 mt-1">{errors.receiverId.message}</p>
                  )}
                </div>
              </div>

              {/* Transaction Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('transferDate')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.transferDate && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.transferDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    {...register('amount')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Purpose & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Purpose <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency duty travel advance, loan return"
                    {...register('transferPurpose')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.transferPurpose && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.transferPurpose.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Slip No (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRF-REC-771"
                    {...register('referenceNumber')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional memo..."
                  {...register('remarks')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/transfers')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Register Transfer Record</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
