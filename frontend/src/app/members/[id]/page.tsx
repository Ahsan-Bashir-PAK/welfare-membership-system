'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  CreditCard,
  HeartHandshake,
  ArrowLeftRight,
  History,
  Shield,
  Calendar,
  Phone,
  MapPin,
  Building,
  Edit,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileText,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isSuperAdmin, isFocalPerson } = useAuth();

  const [member, setMember] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'welfare' | 'transfers' | 'history'>('profile');

  // Tab Data
  const [payments, setPayments] = useState<any[]>([]);
  const [welfare, setWelfare] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'Active' | 'Disable'>('Active');
  const [statusReason, setStatusReason] = useState('');

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [newMembershipDate, setNewMembershipDate] = useState('');
  const [dateReason, setDateReason] = useState('');

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<'Super Admin' | 'Focal Person' | 'User'>('User');

  const fetchMember = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/members/${id}`);
      if (res.data?.success) {
        setMember(res.data.member);
        setSummary(res.data.summary);
        setNewStatus(res.data.member.membership_status);
        setNewMembershipDate(res.data.member.membership_date || '');
        setNewRole(res.data.member.account_role);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    if (!member) return;
    try {
      if (activeTab === 'payments') {
        const res = await api.get('/payments', { params: { memberId: member.id } });
        if (res.data?.success) setPayments(res.data.data);
      } else if (activeTab === 'welfare') {
        const res = await api.get('/welfare', { params: { memberId: member.id } });
        if (res.data?.success) setWelfare(res.data.data);
      } else if (activeTab === 'transfers') {
        const res = await api.get('/transfers', { params: { search: member.cnic } });
        if (res.data?.success) setTransfers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, member]);

  const handleUpdateStatus = async () => {
    try {
      await api.patch(`/members/${member.id}/status`, {
        status: newStatus,
        reason: statusReason || 'Status updated from profile view',
      });
      setStatusModalOpen(false);
      fetchMember();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleUpdateMembershipDate = async () => {
    try {
      await api.patch(`/members/${member.id}/membership-date`, {
        membershipDate: newMembershipDate,
        reason: dateReason || 'Membership date adjusted from profile view',
      });
      setDateModalOpen(false);
      fetchMember();
    } catch (err: any) {
      alert(err.message || 'Date update failed');
    }
  };

  const handleUpdateRole = async () => {
    try {
      await api.patch(`/members/${member.id}/role`, {
        role: newRole,
      });
      setRoleModalOpen(false);
      fetchMember();
    } catch (err: any) {
      alert(err.message || 'Role change failed');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Member Profile">
        <div className="py-20 text-center text-xs text-slate-400">Loading member profile details...</div>
      </AppLayout>
    );
  }

  if (error || !member) {
    return (
      <AppLayout title="Member Profile">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error || 'Member profile could not be found.'}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Member Profile — ${member.name}`}>
      <div className="space-y-6">
        {/* Top Back Navigation & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Member Directory</span>
          </Link>

          {(isSuperAdmin || isFocalPerson) && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateModalOpen(true)}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Update Membership Date</span>
              </Button>

              <Button
                variant={member.membership_status === 'Active' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setStatusModalOpen(true)}
              >
                <span>Change Status ({member.membership_status})</span>
              </Button>

              {isSuperAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRoleModalOpen(true)}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Assign Role ({member.account_role})</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Member Header Card */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-lg">
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-white/10">
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">{member.name}</h1>
                  <Badge variant={member.membership_status === 'Active' ? 'active' : 'disable'}>
                    {member.membership_status}
                  </Badge>
                  <Badge variant={member.account_role === 'Super Admin' ? 'admin' : member.account_role === 'Focal Person' ? 'focal' : 'user'}>
                    {member.account_role}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  CNIC: {member.cnic} &bull; Member ID: <span className="text-blue-300 font-bold">{member.member_id}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {member.rank_name} &bull; {member.posting} &bull; {member.zone_name}
                </p>
              </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Payments</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(summary?.totalPayments || 0)}
                </p>
                <p className="text-[10px] text-slate-400">{summary?.countPayments || 0} vouchers</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Welfare Received</p>
                <p className="text-sm font-bold text-blue-400 mt-0.5">
                  {formatCurrency(summary?.totalWelfare || 0)}
                </p>
                <p className="text-[10px] text-slate-400">{summary?.countWelfare || 0} claims</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Transfers Sent</p>
                <p className="text-sm font-bold text-purple-400 mt-0.5">
                  {formatCurrency(summary?.totalTransfersSent || 0)}
                </p>
                <p className="text-[10px] text-slate-400">{summary?.countTransfersSent || 0} transactions</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments History</span>
          </button>
          <button
            onClick={() => setActiveTab('welfare')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'welfare'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Welfare Support</span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'transfers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Member Transfers</span>
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Identity & Personal Information" />
              <CardBody className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{member.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Father Name</span>
                  <span className="font-semibold text-slate-900">{member.father_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">CNIC Number</span>
                  <span className="font-mono font-semibold text-slate-900">{member.cnic}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-semibold text-slate-900">{formatDate(member.date_of_birth)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Contact Number</span>
                  <span className="font-mono font-semibold text-slate-900">{member.contact}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Membership Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(member.membership_date)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Residential Address</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs">{member.address}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Departmental & Geographic Posting" />
              <CardBody className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Official Rank</span>
                  <span className="font-semibold text-slate-900">{member.rank_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Station / Posting</span>
                  <span className="font-semibold text-slate-900">{member.posting}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Zone</span>
                  <span className="font-semibold text-slate-900">{member.zone_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Sector</span>
                  <span className="font-semibold text-slate-900">{member.sector_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Beat</span>
                  <span className="font-semibold text-slate-900">{member.beat_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Account Role</span>
                  <Badge variant={member.account_role === 'Super Admin' ? 'admin' : member.account_role === 'Focal Person' ? 'focal' : 'user'}>
                    {member.account_role}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Registration Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(member.created_at)}</span>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Tab 2: Payments History */}
        {activeTab === 'payments' && (
          <Card>
            <CardHeader
              title="Recorded Member Payments"
              subtitle={`Money received from ${member.name}`}
              action={
                (isSuperAdmin || isFocalPerson) && (
                  <Link href={`/payments/add?memberId=${member.id}`}>
                    <Button variant="primary" size="sm">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record New Payment</span>
                    </Button>
                  </Link>
                )
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No payments recorded for this member.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-mono font-medium text-blue-700">{p.payment_number}</td>
                        <td className="py-3 px-4">{formatDate(p.payment_date)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-4">{p.payment_type}</td>
                        <td className="py-3 px-4">{p.payment_method}</td>
                        <td className="py-3 px-4">
                          <Badge variant={p.status === 'Posted' ? 'posted' : p.status === 'Reversed' ? 'reversed' : 'draft'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Welfare Support */}
        {activeTab === 'welfare' && (
          <Card>
            <CardHeader
              title="Welfare Assistance History"
              subtitle={`Aid disbursed to ${member.name}`}
              action={
                (isSuperAdmin || isFocalPerson) && (
                  <Link href={`/welfare/add?memberId=${member.id}`}>
                    <Button variant="primary" size="sm">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Record Welfare Aid</span>
                    </Button>
                  </Link>
                )
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Support Area</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {welfare.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No welfare assistance recorded for this member.
                      </td>
                    </tr>
                  ) : (
                    welfare.map((w) => (
                      <tr key={w.id}>
                        <td className="py-3 px-4 font-mono font-medium text-emerald-700">{w.support_number}</td>
                        <td className="py-3 px-4">{formatDate(w.payment_date)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(w.amount)}</td>
                        <td className="py-3 px-4 font-medium">{w.support_area}</td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{w.description}</td>
                        <td className="py-3 px-4">
                          <Badge variant={w.status === 'Posted' ? 'posted' : w.status === 'Reversed' ? 'reversed' : 'draft'}>
                            {w.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Transfers */}
        {activeTab === 'transfers' && (
          <Card>
            <CardHeader
              title="Member-to-Member Transfers Register"
              subtitle="Recorded peer-to-peer transfers (Record only)"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Register No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Receiver</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No recorded transfers involving this member.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 px-4 font-mono font-medium text-purple-700">{t.transfer_number}</td>
                        <td className="py-3 px-4">{formatDate(t.transfer_date)}</td>
                        <td className="py-3 px-4 font-medium">{t.sender_name}</td>
                        <td className="py-3 px-4 font-medium">{t.receiver_name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(t.amount)}</td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{t.transfer_purpose}</td>
                        <td className="py-3 px-4">
                          <Badge variant={t.status === 'Posted' ? 'posted' : t.status === 'Reversed' ? 'reversed' : 'draft'}>
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modal: Change Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Member Status"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Status</label>
            <select
              value={newStatus}
              onChange={(e: any) => setNewStatus(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300"
            >
              <option value="Active">Active</option>
              <option value="Disable">Disable</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason (Audited)</label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide reason for this status modification..."
              className="w-full p-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
              Save Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Update Membership Date */}
      <Modal
        isOpen={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        title="Update Membership Date"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Membership Date</label>
            <input
              type="date"
              value={newMembershipDate}
              onChange={(e) => setNewMembershipDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason (Audited)</label>
            <textarea
              rows={3}
              value={dateReason}
              onChange={(e) => setDateReason(e.target.value)}
              placeholder="State administrative reason for date adjustment..."
              className="w-full p-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateMembershipDate}>
              Save Membership Date
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Change Role (Super Admin Only) */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Designate Account Role"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
            <select
              value={newRole}
              onChange={(e: any) => setNewRole(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300"
            >
              <option value="User">User</option>
              <option value="Focal Person">Focal Person</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateRole}>
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
