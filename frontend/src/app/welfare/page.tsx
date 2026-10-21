'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HeartHandshake,
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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function WelfarePage() {
  const { user, isSuperAdmin, isFocalPerson, isRegularUser } = useAuth();
  const [welfareList, setWelfareList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [supportAreas, setSupportAreas] = useState<any[]>([]);

  // Modals
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [reversalWelfare, setReversalWelfare] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const fetchWelfare = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        supportArea: areaFilter || undefined,
      };

      const res = await api.get('/welfare', { params });
      if (res.data?.success) {
        setWelfareList(res.data.data);
        setPagination(res.data.pagination);
        setTotalAmount(res.data.totalAmount || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve welfare records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportAreas = async () => {
    try {
      const res = await api.get('/master-data');
      if (res.data?.success) {
        setSupportAreas(res.data.data.supportAreas || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSupportAreas();
    fetchWelfare(1);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWelfare(1);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleExecuteReversal = async () => {
    if (!reversalWelfare || !reversalReason.trim()) return;
    setIsReversing(true);
    try {
      await api.post(`/welfare/${reversalWelfare.id}/reverse`, {
        reason: reversalReason.trim(),
      });
      setReversalWelfare(null);
      fetchWelfare(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <AppLayout title="Welfare Assistance Disbursements">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Welfare Support & Relief Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited disbursements of medical assistance, bereavement support, and emergency relief to members.
            </p>
          </div>

          {!isRegularUser && (
            <Link href="/welfare/add">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                <span>Add Welfare Support</span>
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Total Summary Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
              Total Posted Welfare Paid Out
            </span>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Cumulative humanitarian disbursements verified and released to institutional beneficiaries.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-100 font-mono">
              Total Relief Claims: <strong>{pagination.total}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardBody className="p-4">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Voucher #, CNIC, Member Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Posted">Posted</option>
                  <option value="Draft">Draft</option>
                  <option value="Reversed">Reversed</option>
                </select>
              </div>

              <div>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Support Areas</option>
                  {supportAreas.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="md" className="flex-1 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setAreaFilter('');
                    fetchWelfare(1);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Welfare Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Voucher No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Beneficiary Member</th>
                  <th className="py-3.5 px-4">Support Area</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading welfare records...
                    </td>
                  </tr>
                ) : welfareList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No welfare support records found.
                    </td>
                  </tr>
                ) : (
                  welfareList.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {w.support_number}
                      </td>
                      <td className="py-3.5 px-4">{formatDate(w.payment_date)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{w.member_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{w.member_cnic}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{w.support_area}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">{w.description}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            w.status === 'Posted'
                              ? 'posted'
                              : w.status === 'Reversed'
                              ? 'reversed'
                              : 'draft'
                          }
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVoucher(w)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                            title="View Official Disbursement Voucher"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {isSuperAdmin && w.status === 'Posted' && (
                            <button
                              onClick={() => {
                                setReversalWelfare(w);
                                setReversalReason('');
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Audited Welfare Reversal"
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
                  onClick={() => fetchWelfare(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchWelfare(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Official Disbursement Voucher Modal */}
      <Modal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        title="Official Welfare Disbursement Voucher"
        maxWidth="lg"
      >
        {selectedVoucher && (
          <div className="space-y-6">
            <div
              id="printable-voucher"
              className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs printable-card text-xs"
            >
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      Institutional Welfare Authority
                    </h2>
                    <p className="text-[10px] text-slate-500">Official Welfare Disbursement Voucher</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-emerald-700">
                    {selectedVoucher.support_number}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Disbursed: {formatDate(selectedVoucher.payment_date)}
                  </p>
                </div>
              </div>

              <div className="my-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Status:
                </span>
                <Badge
                  variant={
                    selectedVoucher.status === 'Posted'
                      ? 'posted'
                      : selectedVoucher.status === 'Reversed'
                      ? 'reversed'
                      : 'draft'
                  }
                >
                  {selectedVoucher.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Beneficiary Member</p>
                  <p className="text-sm font-bold text-slate-900">{selectedVoucher.member_name}</p>
                  <p className="font-mono text-slate-600 mt-0.5">CNIC: {selectedVoucher.member_cnic}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-400">Support Area</p>
                  <p className="font-semibold text-slate-900">{selectedVoucher.support_area}</p>
                  <p className="text-slate-600 mt-0.5">Method: {selectedVoucher.payment_method}</p>
                </div>
              </div>

              <div className="py-4 my-2 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                  Approved Relief Assistance Amount
                </p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {formatCurrency(selectedVoucher.amount)}
                </p>
              </div>

              <div className="py-2 text-[11px] text-slate-600">
                <span className="font-semibold">Sanction Justification:</span> {selectedVoucher.description}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-200 text-center">
                <div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Welfare Disbursement Officer</p>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Beneficiary Member Acknowledgement</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <Button variant="outline" size="md" onClick={() => setSelectedVoucher(null)}>
                Close
              </Button>
              <Button variant="primary" size="md" onClick={handlePrintVoucher}>
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Audited Reversal Modal */}
      <Modal
        isOpen={Boolean(reversalWelfare)}
        onClose={() => setReversalWelfare(null)}
        title="Audited Welfare Support Reversal"
        subtitle={`Reversing voucher ${reversalWelfare?.support_number} (${formatCurrency(reversalWelfare?.amount)})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <span className="font-bold">Audit Policy Alert:</span>
            <p className="mt-1">
              Reversing this welfare record preserves the original voucher in the historical ledger with status marked as <strong>Reversed</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="State verified institutional reason for reversing this disbursement (minimum 5 characters)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              disabled={isReversing}
              onClick={() => setReversalWelfare(null)}
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
