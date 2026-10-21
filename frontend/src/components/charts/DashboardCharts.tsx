'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function DashboardCharts({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly Financial Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Collections */}
        <Card>
          <CardHeader
            title="Monthly Payment Collections"
            subtitle="Posted funds received from members over the past 12 months"
          />
          <CardBody>
            <div className="h-72 w-full">
              {data.monthlyPayments && data.monthlyPayments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyPayments} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), 'Collections']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No payment activity in the specified period.
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Welfare Disbursements */}
        <Card>
          <CardHeader
            title="Monthly Welfare Assistance"
            subtitle="Posted humanitarian and medical aid disbursed to members"
          />
          <CardBody>
            <div className="h-72 w-full">
              {data.monthlyWelfare && data.monthlyWelfare.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyWelfare} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), 'Disbursed']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No welfare disbursement activity recorded.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Row 2: Member Distributions & Transfer Volume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members by Role */}
        <Card>
          <CardHeader title="Members by Role" subtitle="Account privilege distribution" />
          <CardBody>
            <div className="h-60 w-full">
              {data.membersByRole && data.membersByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.membersByRole}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {data.membersByRole.map((_: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [val, 'Members']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No role data available.
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Welfare by Support Area */}
        <Card>
          <CardHeader title="Welfare by Area" subtitle="Assistance categories" />
          <CardBody>
            <div className="h-60 w-full">
              {data.welfareByArea && data.welfareByArea.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.welfareByArea}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {data.welfareByArea.map((_: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrency(val), 'Amount']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No welfare areas recorded.
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Monthly Transfer Register Volume (Record-Only) */}
        <Card>
          <CardHeader
            title="Transfer Volume"
            subtitle="Peer-to-peer recorded register (Record Only)"
          />
          <CardBody>
            <div className="h-60 w-full">
              {data.monthlyTransfers && data.monthlyTransfers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTransfers} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val), 'Recorded Volume']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="volume" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No member-to-member transfers recorded.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
