'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  Building,
  MapPin,
  HeartHandshake,
  Shield,
  CheckCircle2,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Compass,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

type DeleteTarget = {
  type: 'rank' | 'zone' | 'sector' | 'beat' | 'supportArea';
  id: number;
  name: string;
};

export default function MasterDataPage() {
  const [data, setData] = useState<{
    ranks: any[];
    zones: any[];
    sectors: any[];
    beats: any[];
    supportAreas: any[];
  }>({
    ranks: [],
    zones: [],
    sectors: [],
    beats: [],
    supportAreas: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Modals
  const [modalType, setModalType] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [parentZoneId, setParentZoneId] = useState<number | ''>('');
  const [parentSectorId, setParentSectorId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMasterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/master-data');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (modalType === 'rank') {
        await api.post('/master-data/ranks', { name: nameInput, description: descInput });
        setSuccessMsg(`Rank "${nameInput}" added successfully.`);
      } else if (modalType === 'zone') {
        await api.post('/master-data/zones', { name: nameInput, code: codeInput });
        setSuccessMsg(`Administrative Zone "${nameInput}" added successfully.`);
      } else if (modalType === 'sector') {
        await api.post('/master-data/sectors', { zoneId: Number(parentZoneId), name: nameInput, code: codeInput });
        setSuccessMsg(`Operational Sector "${nameInput}" added successfully.`);
      } else if (modalType === 'beat') {
        await api.post('/master-data/beats', { sectorId: Number(parentSectorId), name: nameInput, code: codeInput });
        setSuccessMsg(`Field Beat "${nameInput}" added successfully.`);
      } else if (modalType === 'supportArea') {
        await api.post('/master-data/support-areas', { name: nameInput, description: descInput });
        setSuccessMsg(`Welfare Category "${nameInput}" added successfully.`);
      }
      setModalType(null);
      setNameInput('');
      setDescInput('');
      setCodeInput('');
      setParentZoneId('');
      setParentSectorId('');
      await fetchMasterData();
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      let endpoint = '';
      if (deleteTarget.type === 'rank') endpoint = `/master-data/ranks/${deleteTarget.id}`;
      else if (deleteTarget.type === 'zone') endpoint = `/master-data/zones/${deleteTarget.id}`;
      else if (deleteTarget.type === 'sector') endpoint = `/master-data/sectors/${deleteTarget.id}`;
      else if (deleteTarget.type === 'beat') endpoint = `/master-data/beats/${deleteTarget.id}`;
      else if (deleteTarget.type === 'supportArea') endpoint = `/master-data/support-areas/${deleteTarget.id}`;

      await api.delete(endpoint);
      setSuccessMsg(`"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await fetchMasterData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Institutional Master Data">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Master Institutional Reference Data</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain and manage official ranks, administrative command zones (e.g. Motorway North, MC-I), operational sectors, field beats, and welfare assistance categories.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Official Ranks */}
          <Card>
            <CardHeader
              title="Official Service Ranks"
              subtitle="Uniform departmental rank classifications"
              action={
                <Button variant="primary" size="sm" onClick={() => setModalType('rank')}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rank</span>
                </Button>
              }
            />
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {data.ranks.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No ranks defined</div>
              )}
              {data.ranks.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition">
                  <div className="pr-2">
                    <p className="font-semibold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.description || 'Standard Rank'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="active">Active</Badge>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'rank', id: r.id, name: r.name })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Rank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 2. Support Areas for Welfare */}
          <Card>
            <CardHeader
              title="Welfare Assistance Categories"
              subtitle="Authorized humanitarian support categories"
              action={
                <Button variant="primary" size="sm" onClick={() => setModalType('supportArea')}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </Button>
              }
            />
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {data.supportAreas.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No welfare categories defined</div>
              )}
              {data.supportAreas.map((sa) => (
                <div key={sa.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition">
                  <div className="pr-2">
                    <p className="font-semibold text-slate-900">{sa.name}</p>
                    <p className="text-[11px] text-slate-400">{sa.description || 'Welfare Category'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="active">Active</Badge>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'supportArea', id: sa.id, name: sa.name })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Welfare Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Administrative Zones */}
          <Card>
            <CardHeader
              title="Administrative Command Zones"
              subtitle="Primary regional command jurisdictions"
              action={
                <Button variant="primary" size="sm" onClick={() => setModalType('zone')}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Zone</span>
                </Button>
              }
            />
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {data.zones.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No zones defined</div>
              )}
              {data.zones.map((z) => (
                <div key={z.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition">
                  <div className="pr-2">
                    <p className="font-semibold text-slate-900">{z.name}</p>
                    <p className="font-mono text-[11px] text-slate-400">Code: {z.code}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="active">Zone</Badge>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'zone', id: z.id, name: z.name })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Administrative Zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Operational Sectors */}
          <Card>
            <CardHeader
              title="Operational Sectors"
              subtitle="Sub-divisional sectors grouped under administrative zones"
              action={
                <Button variant="primary" size="sm" onClick={() => setModalType('sector')}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sector</span>
                </Button>
              }
            />
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {data.sectors.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No sectors defined</div>
              )}
              {data.sectors.map((s) => {
                const parentZone = data.zones.find((z) => z.id === s.zone_id);
                return (
                  <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition">
                    <div className="pr-2">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-400">
                        <span className="font-mono font-medium text-slate-600">{s.code}</span>
                        {parentZone && <span> • Zone: {parentZone.name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="active">Sector</Badge>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'sector', id: s.id, name: s.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Sector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 5. Field Beats */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Operational Field Beats"
              subtitle="Field beats assigned to operational sectors"
              action={
                <Button variant="primary" size="sm" onClick={() => setModalType('beat')}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Beat</span>
                </Button>
              }
            />
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {data.beats.length === 0 && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No beats defined</div>
              )}
              {data.beats.map((b) => {
                const parentSector = data.sectors.find((sec) => sec.id === b.sector_id);
                return (
                  <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition">
                    <div className="pr-2">
                      <p className="font-semibold text-slate-900">{b.name}</p>
                      <p className="text-[11px] text-slate-400">
                        <span className="font-mono font-medium text-slate-600">{b.code}</span>
                        {parentSector && <span> • Sector: {parentSector.name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="neutral">Beat</Badge>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'beat', id: b.id, name: b.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Beat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Master Data Item Modal */}
      <Modal
        isOpen={Boolean(modalType)}
        onClose={() => setModalType(null)}
        title={`Add New ${
          modalType === 'rank'
            ? 'Service Rank'
            : modalType === 'zone'
            ? 'Administrative Zone'
            : modalType === 'sector'
            ? 'Operational Sector'
            : modalType === 'beat'
            ? 'Field Beat'
            : 'Welfare Assistance Category'
        }`}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {modalType === 'sector' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Command Zone *</label>
              <select
                value={parentZoneId}
                onChange={(e: any) => setParentZoneId(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">Select Parent Zone</option>
                {data.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalType === 'beat' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Operational Sector *</label>
              <select
                value={parentSectorId}
                onChange={(e: any) => setParentSectorId(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">Select Parent Sector</option>
                {data.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title / Name *</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Motorway North, MC-I, Inspector, Medical Aid..."
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {(modalType === 'zone' || modalType === 'sector' || modalType === 'beat') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unique Identifier Code *</label>
              <input
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="e.g. MW-N, MC-I, SEC-04, BT-10..."
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          )}

          {(modalType === 'rank' || modalType === 'supportArea') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description / Functional Notes</label>
              <textarea
                rows={2}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Brief purpose and scope..."
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setModalType(null)} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={isSubmitting}>
              Add Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Are you sure you want to delete {deleteTarget?.name}?
              </p>
              {deleteTarget?.type === 'zone' && (
                <p className="text-[11px] text-amber-800">
                  Deleting this administrative zone will also delete all operational sectors and beats under it. Existing member profiles will keep their historical zone title in records.
                </p>
              )}
              {deleteTarget?.type === 'sector' && (
                <p className="text-[11px] text-amber-800">
                  Deleting this sector will also delete all operational beats assigned to it. Existing member profiles will keep their historical sector title.
                </p>
              )}
              {deleteTarget?.type === 'rank' && (
                <p className="text-[11px] text-amber-800">
                  Existing members holding this rank will retain the rank title in historical profiles.
                </p>
              )}
              {deleteTarget?.type === 'beat' && (
                <p className="text-[11px] text-amber-800">
                  Existing members assigned to this beat will retain the beat title in historical profiles.
                </p>
              )}
              {deleteTarget?.type === 'supportArea' && (
                <p className="text-[11px] text-amber-800">
                  Past welfare disbursements made under this category will retain their category name in records.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setDeleteTarget(null)} type="button" disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} loading={isDeleting}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
