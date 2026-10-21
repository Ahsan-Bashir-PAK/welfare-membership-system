'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserPlus, Eye, Search, AlertCircle, Phone, Building } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function FocalPersonsPage() {
  const [focalPersons, setFocalPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFocalPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/members', { params: { role: 'Focal Person', limit: 50 } });
      if (res.data?.success) {
        setFocalPersons(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load focal officers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFocalPersons();
  }, []);

  return (
    <AppLayout title="Focal Persons Directorate">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Designated Focal Officers</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized field coordinators entitled to record collections, register regular members, and manage operational claims.
            </p>
          </div>

          <Link href="/members/add">
            <Button variant="primary" size="md">
              <UserPlus className="w-4 h-4" />
              <span>Register New Officer</span>
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              Loading focal officers...
            </div>
          ) : focalPersons.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              No designated Focal Persons currently registered.
            </div>
          ) : (
            focalPersons.map((fp) => (
              <Card key={fp.id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{fp.name}</h3>
                      <p className="font-mono text-[11px] text-slate-500">{fp.cnic}</p>
                    </div>
                    <Badge variant="focal">Focal Person</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Rank:</span> {fp.rank_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Station:</span> {fp.posting}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Zone:</span> {fp.zone_name} &bull; {fp.sector_name}
                    </p>
                    <p className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fp.contact}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      ID: <strong className="font-mono text-slate-600">{fp.member_id}</strong>
                    </span>
                    <Link
                      href={`/members/${fp.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
