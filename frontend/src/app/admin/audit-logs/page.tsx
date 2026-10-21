'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Eye,
  User,
  Clock,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        actionType: actionType || undefined,
        actorRole: actorRole || undefined,
      };

      const res = await api.get('/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <AppLayout title="Institutional Audit Trail">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Institutional Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological log of sensitive administrative, financial, and membership operations. Restricted to Super Admin.
          </p>
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
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Entity ID, Actor CNIC, Reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Action Types</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="CREATE_MEMBER">CREATE_MEMBER</option>
                  <option value="UPDATE_MEMBER_STATUS">UPDATE_MEMBER_STATUS</option>
                  <option value="UPDATE_ACCOUNT_ROLE">UPDATE_ACCOUNT_ROLE</option>
                  <option value="CREATE_PAYMENT">CREATE_PAYMENT</option>
                  <option value="REVERSE_PAYMENT">REVERSE_PAYMENT</option>
                  <option value="CREATE_WELFARE">CREATE_WELFARE</option>
                  <option value="REVERSE_WELFARE">REVERSE_WELFARE</option>
                  <option value="CREATE_TRANSFER">CREATE_TRANSFER</option>
                  <option value="REVERSE_TRANSFER">REVERSE_TRANSFER</option>
                  <option value="FORGOT_PASSWORD_RESET">FORGOT_PASSWORD_RESET</option>
                </select>
              </div>

              <div>
                <select
                  value={actorRole}
                  onChange={(e) => setActorRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Actor Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Focal Person">Focal Person</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="md" className="flex-1 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Trail</span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setActionType('');
                    setActorRole('');
                    fetchLogs(1);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Reason / Details</th>
                  <th className="py-3 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No audit records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{log.actor_cnic}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.actor_role === 'Super Admin'
                              ? 'admin'
                              : log.actor_role === 'Focal Person'
                              ? 'focal'
                              : 'user'
                          }
                        >
                          {log.actor_role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{log.action_type}</td>
                      <td className="py-3 px-4 text-slate-600">{log.entity_type}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.entity_id}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{log.reason || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
                          title="View JSON Payload Diff"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit entries)
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* JSON Payload Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Inspector"
        subtitle={`Action: ${selectedLog?.action_type} on ${selectedLog?.entity_type} (#${selectedLog?.entity_id})`}
        maxWidth="xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Actor CNIC</p>
                <p className="font-mono font-bold text-slate-900">{selectedLog.actor_cnic}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Role at Action</p>
                <p className="font-semibold text-slate-900">{selectedLog.actor_role}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">IP Address</p>
                <p className="font-mono text-slate-700">{selectedLog.ip_address || '127.0.0.1'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Timestamp</p>
                <p className="font-mono text-slate-700">
                  {new Date(selectedLog.created_at).toISOString()}
                </p>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900">
                <span className="font-bold">Declared Justification:</span> {selectedLog.reason}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Previous State Payload
                </label>
                <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-56">
                  {selectedLog.previous_value
                    ? JSON.stringify(selectedLog.previous_value, null, 2)
                    : '// No previous state'}
                </pre>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New State Payload
                </label>
                <pre className="p-3 rounded-lg bg-slate-900 text-sky-400 font-mono text-[10px] overflow-x-auto max-h-56">
                  {selectedLog.new_value
                    ? JSON.stringify(selectedLog.new_value, null, 2)
                    : '// No new state'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
