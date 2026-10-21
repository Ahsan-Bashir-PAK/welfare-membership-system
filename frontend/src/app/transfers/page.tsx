'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Receipt,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function TransfersPage() {
  const { user, isSuperAdmin, isFocalPerson, isRegularUser } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [reversalTransfer, setReversalTransfer] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const fetchTransfers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      };

      const res = await api.get('/transfers', { params });
      if (res.data?.success) {
        setTransfers(res.data.data);
        setPagination(res.data.pagination);
        setTotalVolume(res.data.totalRecordedTransferVolume || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve transfer register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers(1);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransfers(1);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleExecuteReversal = async () => {
    if (!reversalTransfer || !reversalReason.trim()) return;
    setIsReversing(true);
    try {
      await api.post(`/transfers/${reversalTransfer.id}/reverse`, {
        reason: reversalReason.trim(),
      });
      setReversalTransfer(null);
      fetchTransfers(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <AppLayout title="Member-to-Member Transfer Register">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Member-to-Member Transfer Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical register recording peer-to-peer money transfers between verified members.
            </p>
          </div>

          {!isRegularUser && (
            <Link href="/transfers/add">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                <span>Record New Transfer</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Critical Accounting Policy Banner */}
        <div className="p-4 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-purple-800">
              Institutional Accounting Model: Historical Register Only
            </span>
            <p className="text-purple-800 leading-relaxed">
              This module operates strictly as an institutional documentation register for peer-to-peer transfers.
              The application <strong>does not create member wallets</strong>, maintain member wallet ledgers, or perform virtual balance deductions.
              Recorded transfer volume reflects mutual member transactions and <strong>does not affect organizational fund balances or income</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Total Summary Banner */}
        <div className="bg-gradient-to-r from-purple-950 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-200">
              Total Recorded Peer Transfer Volume
            </span>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalVolume)}</p>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Accumulated mutual transfer volume registered across all active stations.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-purple-100 font-mono">
              Total Records: <strong>{pagination.total}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardBody className="p-4">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Transfer #, Sender CNIC, Receiver CNIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Posted">Posted</option>
                  <option value="Draft">Draft</option>
                  <option value="Reversed">Reversed</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="md" className="flex-1 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Register</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    fetchTransfers(1);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Transfers Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Register ID</th>
                  <th className="py-3.5 px-4">Transfer Date</th>
                  <th className="py-3.5 px-4">Sender Member</th>
                  <th className="py-3.5 px-4">Receiver Member</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading transfer register...
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No transfer records found.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">
                        {t.transfer_number}
                      </td>
                      <td className="py-3.5 px-4">{formatDate(t.transfer_date)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{t.sender_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{t.sender_cnic}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{t.receiver_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{t.receiver_cnic}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">{t.transfer_purpose}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            t.status === 'Posted'
                              ? 'posted'
                              : t.status === 'Reversed'
                              ? 'reversed'
                              : 'draft'
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVoucher(t)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-purple-600 transition-colors"
                            title="View Transfer Register Voucher"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {isSuperAdmin && t.status === 'Posted' && (
                            <button
                              onClick={() => {
                                setReversalTransfer(t);
                                setReversalReason('');
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Audited Transfer Reversal"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTransfers(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTransfers(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Official Transfer Voucher Modal */}
      <Modal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        title="Official Transfer Register Voucher"
        maxWidth="lg"
      >
        {selectedVoucher && (
          <div className="space-y-6">
            <div
              id="printable-transfer"
              className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs printable-card text-xs"
            >
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      Institutional Welfare Authority
                    </h2>
                    <p className="text-[10px] text-slate-500">Member-to-Member Transfer Register Record</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-purple-700">
                    {selectedVoucher.transfer_number}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Date: {formatDate(selectedVoucher.transfer_date)}
                  </p>
                </div>
              </div>

              <div className="my-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Transaction Classification:
                </span>
                <span className="text-[10px] font-bold text-purple-700">
                  PEER TRANSFER REGISTER (RECORD ONLY)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Sender (Originator)</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedVoucher.sender_name}</p>
                  <p className="font-mono text-slate-600">CNIC: {selectedVoucher.sender_cnic}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Receiver (Beneficiary)</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedVoucher.receiver_name}</p>
                  <p className="font-mono text-slate-600">CNIC: {selectedVoucher.receiver_cnic}</p>
                </div>
              </div>

              <div className="py-4 my-2 text-center bg-purple-50/50 rounded-xl border border-purple-100">
                <p className="text-[10px] uppercase tracking-wider text-purple-700 font-semibold">
                  Recorded Transfer Sum
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {formatCurrency(selectedVoucher.amount)}
                </p>
              </div>

              <div className="py-2 text-[11px] text-slate-600 space-y-1">
                <p><span className="font-semibold">Declared Purpose:</span> {selectedVoucher.transfer_purpose}</p>
                <p><span className="font-semibold">Payment Method:</span> {selectedVoucher.payment_method}</p>
                {selectedVoucher.reference_number && (
                  <p className="font-mono"><span className="font-semibold">Reference:</span> {selectedVoucher.reference_number}</p>
                )}
                {selectedVoucher.remarks && (
                  <p><span className="font-semibold">Remarks:</span> {selectedVoucher.remarks}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-10 mt-6 border-t border-slate-200 text-center">
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Sender Signature</p>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Receiver Signature</p>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Recording Officer</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <Button variant="outline" size="md" onClick={() => setSelectedVoucher(null)}>
                Close
              </Button>
              <Button variant="primary" size="md" onClick={handlePrintVoucher}>
                <Printer className="w-4 h-4" />
                <span>Print Transfer Voucher</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Audited Reversal Modal */}
      <Modal
        isOpen={Boolean(reversalTransfer)}
        onClose={() => setReversalTransfer(null)}
        title="Audited Transfer Reversal"
        subtitle={`Reversing transfer ${reversalTransfer?.transfer_number} (${formatCurrency(reversalTransfer?.amount)})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <span className="font-bold">Institutional Policy:</span>
            <p className="mt-1">
              Reversing this recorded transfer preserves the original entry in historical records while setting its status to <strong>Reversed</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Reversal Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="State verified institutional reason for reversing this transfer record (minimum 5 characters)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              disabled={isReversing}
              onClick={() => setReversalTransfer(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={reversalReason.trim().length < 5}
              loading={isReversing}
              onClick={handleExecuteReversal}
            >
              Execute Audited Reversal
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
