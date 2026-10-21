'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Shield,
  Calendar,
  Phone,
  Building,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Archive,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function MembersPage() {
  const { user, isSuperAdmin, isFocalPerson } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Status Change Modal State
  const [statusModalMember, setStatusModalMember] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<'Active' | 'Disable'>('Active');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Master data for filters
  const [ranks, setRanks] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      };

      const res = await api.get('/members', { params });
      if (res.data?.success) {
        setMembers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const res = await api.get('/master-data');
      if (res.data?.success) {
        setRanks(res.data.data.ranks || []);
        setZones(res.data.data.zones || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchMembers(1);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1);
  };

  const openStatusModal = (member: any) => {
    setStatusModalMember(member);
    setNewStatus(member.membership_status === 'Active' ? 'Disable' : 'Active');
    setStatusReason('');
  };

  const handleStatusUpdate = async () => {
    if (!statusModalMember) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/members/${statusModalMember.id}/status`, {
        status: newStatus,
        reason: statusReason || 'Status updated from member directory table',
      });
      setStatusModalMember(null);
      fetchMembers(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AppLayout title="Institutional Member Directory">
      <div className="space-y-6">
        {/* Header & Registration CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Member Roster & Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified institutional member accounts, service ranks, postings, and active status.
            </p>
          </div>

          {(isSuperAdmin || isFocalPerson) && (
            <Link href="/members/add">
              <Button variant="primary" size="md">
                <UserPlus className="w-4 h-4" />
                <span>Register New Member</span>
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

        {/* Filter Bar */}
        <Card>
          <CardBody className="p-4">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by CNIC, Name, Member ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Membership Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Disable">Disabled</option>
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Account Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Focal Person">Focal Person</option>
                  <option value="User">Regular User</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="md" className="flex-1 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Directory</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setRoleFilter('');
                    fetchMembers(1);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Members Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">CNIC</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Rank / Posting</th>
                  <th className="py-3.5 px-4">Zone / Sector</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Account Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Loading member records...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No member records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-700">
                        {m.member_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{m.cnic}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-400">S/O {m.father_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{m.rank_name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{m.posting}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{m.zone_name}</div>
                        <div className="text-[10px] text-slate-500">{m.sector_name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{m.contact}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => (isSuperAdmin || isFocalPerson) && openStatusModal(m)}
                          disabled={!isSuperAdmin && !isFocalPerson}
                          className="focus:outline-hidden"
                          title="Click to toggle status"
                        >
                          <Badge variant={m.membership_status === 'Active' ? 'active' : 'disable'}>
                            {m.membership_status}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={m.account_role === 'Super Admin' ? 'admin' : m.account_role === 'Focal Person' ? 'focal' : 'user'}>
                          {m.account_role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/members/${m.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                            title="View Member Profile & Transactions"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total members)
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchMembers(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchMembers(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={Boolean(statusModalMember)}
        onClose={() => setStatusModalMember(null)}
        title="Update Member Status"
        subtitle={`Modifying operational status for ${statusModalMember?.name} (${statusModalMember?.member_id})`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select New Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewStatus('Active')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  newStatus === 'Active'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setNewStatus('Disable')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  newStatus === 'Disable'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Disable</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Status Change (Audited)
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide justification for auditing and administrative history..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStatusModalMember(null)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant={newStatus === 'Active' ? 'primary' : 'danger'}
              size="md"
              loading={isUpdatingStatus}
              onClick={handleStatusUpdate}
            >
              Confirm Status Change
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
