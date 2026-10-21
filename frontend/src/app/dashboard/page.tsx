'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  HeartHandshake,
  ArrowLeftRight,
  UserCheck,
  UserX,
  Shield,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DashboardCharts } from '@/components/charts/DashboardCharts';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, chartsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/charts'),
      ]);
      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (chartsRes.data?.success) setChartsData(chartsRes.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AppLayout title="Institutional Executive Dashboard">
      <div className="space-y-6">
        {/* Top Header / Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Institutional Overview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit-verified membership records, collections, and humanitarian aid.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <span>Download Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Membership Summary Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Membership Summary</span>
            </h2>
            <Link
              href="/members"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View Directory &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Total Members */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500 truncate">Total Members</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.total : '—'}
              </p>
            </div>

            {/* Active Members */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-emerald-600 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.active : '—'}
              </p>
            </div>

            {/* Disabled Members */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-rose-600 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Disabled</span>
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.disabled : '—'}
              </p>
            </div>

            {/* Super Admins */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-indigo-600 truncate">Super Admins</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.superAdmins : '—'}
              </p>
            </div>

            {/* Focal Persons */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-sky-600 truncate">Focal Persons</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.focalPersons : '—'}
              </p>
            </div>

            {/* Regular Users */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500 truncate">Regular Users</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {summary ? summary.membership.regularUsers : '—'}
              </p>
            </div>

            {/* New This Month */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs bg-blue-50/20">
              <p className="text-[11px] font-medium text-blue-700 truncate">New Month</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                +{summary ? summary.membership.newThisMonth : '0'}
              </p>
            </div>

            {/* New This Year */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs bg-blue-50/20">
              <p className="text-[11px] font-medium text-blue-700 truncate">New Year</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                +{summary ? summary.membership.newThisYear : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Financial Collections & Disbursements Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payments Received Card */}
          <Card className="border-t-4 border-t-blue-600">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Payments Received
                </span>
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary ? formatCurrency(summary.payments.total) : 'PKR 0.00'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total Posted Collections ({summary?.payments?.count || 0} vouchers)
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Today</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.payments.today) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.payments.thisMonth) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Year</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.payments.thisYear) : 'PKR 0'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Welfare Support Disbursed Card */}
          <Card className="border-t-4 border-t-emerald-600">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Welfare Assistance Paid
                </span>
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <HeartHandshake className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary ? formatCurrency(summary.welfare.total) : 'PKR 0.00'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total Posted Humanitarian Aid ({summary?.welfare?.count || 0} claims)
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Today</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.welfare.today) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.welfare.thisMonth) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Year</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.welfare.thisYear) : 'PKR 0'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Member Transfers Register Card (Record-Only) */}
          <Card className="border-t-4 border-t-purple-600">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                    Member Transfers
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-purple-100 text-purple-800 font-bold">
                    RECORD ONLY
                  </span>
                </div>
                <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <ArrowLeftRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary ? formatCurrency(summary.transfers.totalVolume) : 'PKR 0.00'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recorded Peer Volume ({summary?.transfers?.totalCount || 0} transactions)
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Today</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.transfers.todayVolume) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Month</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.transfers.thisMonthVolume) : 'PKR 0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">This Year</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {summary ? formatCurrency(summary.transfers.thisYearVolume) : 'PKR 0'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Organizational Fund Balance Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">
                Institutional Fund Policy Status: {summary?.organizationalFund?.status || 'Not Configured'}
              </span>
              <p className="text-slate-500 mt-0.5">
                {summary?.organizationalFund?.notice ||
                  'Organizational fund opening balance has not been initialized. No simulated balance is fabricated. Member transfers do not affect fund balance.'}
              </p>
            </div>
          </div>
          <Link
            href="/reports"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            Fund Accounting Rules &rarr;
          </Link>
        </div>

        {/* 4. Interactive Data Visualizations */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Visualizations</span>
          </h2>
          <DashboardCharts data={chartsData} />
        </div>
      </div>
    </AppLayout>
  );
}
