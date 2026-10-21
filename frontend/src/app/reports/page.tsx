'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Users,
  CreditCard,
  HeartHandshake,
  ArrowLeftRight,
  Shield,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'payments' | 'welfare' | 'transfers' | 'fund'>('members');

  // Filter states
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report results
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportMeta, setReportMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        activeTab === 'members'
          ? '/reports/members'
          : activeTab === 'payments'
          ? '/reports/payments'
          : activeTab === 'welfare'
          ? '/reports/welfare'
          : activeTab === 'transfers'
          ? '/reports/transfers'
          : '/reports/organizational-fund';

      const params: any = {
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get(endpoint, { params });
      if (res.data?.success) {
        if (activeTab === 'fund') {
          setReportMeta(res.data);
          setReportData([]);
        } else {
          setReportData(res.data.data || []);
          setReportMeta(res.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const endpoint =
      activeTab === 'members'
        ? '/reports/members'
        : activeTab === 'payments'
        ? '/reports/payments'
        : activeTab === 'welfare'
        ? '/reports/welfare'
        : '/reports/transfers';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const params = new URLSearchParams({
      exportFormat: 'excel',
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    window.open(`${baseUrl}${endpoint}?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout title="Institutional Financial & Operational Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Institutional Reports & Audited Statements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive member registries, collection vouchers, welfare claims, and transfer registers.
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            {activeTab !== 'fund' && (
              <Button variant="outline" size="md" onClick={downloadExcel}>
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export to Excel</span>
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>Print Friendly</span>
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-200 flex items-center gap-2 no-print overflow-x-auto pb-0.5">
          <button
            onClick={() => {
              setActiveTab('members');
              setReportData([]);
              setReportMeta(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Reports</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('payments');
              setReportData([]);
              setReportMeta(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Collections</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('welfare');
              setReportData([]);
              setReportMeta(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'welfare'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Welfare Disbursements</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('transfers');
              setReportData([]);
              setReportMeta(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'transfers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Register</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('fund');
              setReportData([]);
              setReportMeta(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fund'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Organizational Fund Policy</span>
          </button>
        </div>

        {/* Filters */}
        {activeTab !== 'fund' && (
          <Card className="no-print">
            <CardBody className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Filter</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="">All Statuses</option>
                    {activeTab === 'members' ? (
                      <>
                        <option value="Active">Active</option>
                        <option value="Disable">Disable</option>
                      </>
                    ) : (
                      <>
                        <option value="Posted">Posted</option>
                        <option value="Draft">Draft</option>
                        <option value="Reversed">Reversed</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="md"
                    loading={loading}
                    onClick={fetchReport}
                    className="w-full text-xs"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Generate Statement</span>
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Fund Tab Detailed View */}
        {activeTab === 'fund' && (
          <div className="space-y-6">
            <Card className="border-t-4 border-t-indigo-600">
              <CardHeader
                title="Institutional Organizational Fund Policy & Verification"
                subtitle="Rules governing organizational income, welfare disbursements, and peer-to-peer transfers"
              />
              <CardBody className="p-6 space-y-4 text-xs text-slate-700">
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                  <p className="font-bold text-sm text-slate-900 mb-1">
                    Fund Balance Status: <span className="text-amber-700">Not Configured</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Under the institutional charter, opening fund balance must be verified through physical audit.
                    Because no certified opening balance has been configured into the ledger, the system displays the fund balance as <strong>Not Configured</strong> rather than fabricating a zero or fictional balance.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Statutory Accounting Principles:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>
                      <strong>Closing Fund Balance Formula:</strong> Opening Fund Balance + Posted Organizational Income - Posted Organizational Expenses - Posted Welfare Disbursements.
                    </li>
                    <li>
                      <strong>Membership Fee Collections:</strong> Included as organizational income only when representing actual money received.
                    </li>
                    <li>
                      <strong>Welfare Disbursements:</strong> Counted only once at the point of disbursement claim approval.
                    </li>
                    <li>
                      <strong>Member-to-Member Transfers:</strong> Recorded peer-to-peer mutual assistance. Does NOT affect organizational fund totals or create virtual liabilities.
                    </li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Report Data Table Preview */}
        {activeTab !== 'fund' && (
          <Card>
            <CardHeader
              title={`Generated Statement Preview (${reportData.length} records)`}
              subtitle="Audited database extract matching your date and status filters."
              action={
                reportMeta?.totalPosted !== undefined && (
                  <span className="text-xs font-bold text-slate-800">
                    Total Posted:{' '}
                    <span className="text-blue-700 font-mono">
                      {formatCurrency(reportMeta.totalPosted)}
                    </span>
                  </span>
                )
              }
            />

            <div className="overflow-x-auto">
              {reportData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {loading
                    ? 'Extracting statement records from database...'
                    : 'Click "Generate Statement" to populate the statement view.'}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      {Object.keys(reportData[0] || {}).map((col) => (
                        <th key={col} className="py-3 px-4 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        {Object.values(row).map((val: any, cellIdx) => (
                          <td key={cellIdx} className="py-2.5 px-4 whitespace-nowrap">
                            {String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
