'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
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

export default function PaymentsPage() {
  const { user, isSuperAdmin, isFocalPerson, isRegularUser } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [reversalPayment, setReversalPayment] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        paymentType: typeFilter || undefined,
        paymentMethod: methodFilter || undefined,
      };

      const res = await api.get('/payments', { params });
      if (res.data?.success) {
        setPayments(res.data.data);
        setPagination(res.data.pagination);
        setTotalAmount(res.data.totalAmount || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments(1);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleExecuteReversal = async () => {
    if (!reversalPayment || !reversalReason.trim()) return;
    setIsReversing(true);
    try {
      await api.post(`/payments/${reversalPayment.id}/reverse`, {
        reason: reversalReason.trim(),
      });
      setReversalPayment(null);
      fetchPayments(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <AppLayout title="Payment Collections Register">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Payment Collections Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited institutional ledger of membership fees, contributions, and donations received.
            </p>
          </div>

          {!isRegularUser && (
            <Link href="/payments/add">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                <span>Record New Payment</span>
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
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
              Total Posted Collections
            </span>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Reflects all verified and posted transactions excluding draft or reversed vouchers.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-blue-100 font-mono">
              Total Vouchers: <strong>{pagination.total}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card>
          <CardBody className="p-4">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Receipt #, CNIC, Member Name..."
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Payment Types</option>
                  <option value="Membership Fee">Membership Fee</option>
                  <option value="Monthly Contribution">Monthly Contribution</option>
                  <option value="Donation">Donation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
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
                    setTypeFilter('');
                    setMethodFilter('');
                    fetchPayments(1);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Payments Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Member CNIC & Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Method & Ref</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading payment records...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                        {p.payment_number}
                      </td>
                      <td className="py-3.5 px-4">{formatDate(p.payment_date)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.member_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.member_cnic}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{p.payment_type}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{p.payment_method}</div>
                        {p.reference_number && (
                          <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            Ref: {p.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            p.status === 'Posted'
                              ? 'posted'
                              : p.status === 'Reversed'
                              ? 'reversed'
                              : 'draft'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Receipt View Button */}
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                            title="View Official Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {/* Reverse Button (Super Admin Only) */}
                          {isSuperAdmin && p.status === 'Posted' && (
                            <button
                              onClick={() => {
                                setReversalPayment(p);
                                setReversalReason('');
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Audited Payment Reversal"
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

          {/* Pagination */}
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
                  onClick={() => fetchPayments(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchPayments(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Official Receipt Modal (Printable) */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official Payment Receipt"
        maxWidth="lg"
      >
        {selectedReceipt && (
          <div className="space-y-6">
            {/* Printable Voucher Paper Card */}
            <div
              id="printable-receipt"
              className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs printable-card text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      Institutional Welfare Authority
                    </h2>
                    <p className="text-[10px] text-slate-500">Official Payment Collection Receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-blue-700">
                    {selectedReceipt.payment_number}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Date: {formatDate(selectedReceipt.payment_date)}
                  </p>
                </div>
              </div>

              {/* Status Banner in receipt */}
              <div className="my-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Transaction Status:
                </span>
                <Badge
                  variant={
                    selectedReceipt.status === 'Posted'
                      ? 'posted'
                      : selectedReceipt.status === 'Reversed'
                      ? 'reversed'
                      : 'draft'
                  }
                >
                  {selectedReceipt.status}
                </Badge>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Received From (Member)</p>
                  <p className="text-sm font-bold text-slate-900">{selectedReceipt.member_name}</p>
                  <p className="font-mono text-slate-600 mt-0.5">CNIC: {selectedReceipt.member_cnic}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-400">Payment Category</p>
                  <p className="font-semibold text-slate-900">{selectedReceipt.payment_type}</p>
                  <p className="text-slate-600 mt-0.5">Method: {selectedReceipt.payment_method}</p>
                  {selectedReceipt.reference_number && (
                    <p className="font-mono text-[10px] text-slate-500">
                      Ref: {selectedReceipt.reference_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="py-4 my-2 text-center bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                  Amount Received in Full
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(selectedReceipt.amount)}
                </p>
              </div>

              {selectedReceipt.remarks && (
                <div className="py-2 text-[11px] text-slate-600">
                  <span className="font-semibold">Remarks:</span> {selectedReceipt.remarks}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-200 text-center">
                <div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Authorized Cashier / Officer</p>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <p className="text-[10px] uppercase text-slate-500 mt-1">Member Signature</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <Button variant="outline" size="md" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" size="md" onClick={handlePrintReceipt}>
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Audited Reversal Modal (Super Admin Only) */}
      <Modal
        isOpen={Boolean(reversalPayment)}
        onClose={() => setReversalPayment(null)}
        title="Audited Transaction Reversal"
        subtitle={`Reversing receipt ${reversalPayment?.payment_number} (${formatCurrency(reversalPayment?.amount)})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <span className="font-bold">Institutional Audit Requirement:</span>
            <p className="mt-1">
              Reversing this payment does NOT delete the transaction. The original record is retained in history and marked as <strong>Reversed</strong>. An official audit log will document your user identity and timestamp.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Justification / Reason for Reversal <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="State verified operational reason for reversing this posted collection (minimum 5 characters)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              disabled={isReversing}
              onClick={() => setReversalPayment(null)}
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
