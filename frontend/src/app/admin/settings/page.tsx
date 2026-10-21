'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data?.success) {
        setSettings(res.data.data);
        const map: Record<string, string> = {};
        res.data.data.forEach((s: any) => {
          map[s.setting_key] = s.setting_value;
        });
        setFormValues(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string) => {
    setSavingKey(key);
    setStatusMsg(null);
    try {
      await api.patch(`/settings/${key}`, { value: formValues[key] });
      setStatusMsg(`Setting '${key}' updated successfully.`);
      fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AppLayout title="Institutional System Settings">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>System Parameters & Security Configurations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional titles, currency parameters, member update permissions, and organizational fund balance status.
          </p>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <Card>
          <CardHeader title="Configuration Registry" />
          <CardBody className="p-6 space-y-6">
            {settings.map((s) => (
              <div key={s.id} className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-800 font-mono">
                      {s.setting_key}
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                    <div className="mt-2">
                      {s.setting_key === 'allow_member_contact_update' ? (
                        <select
                          value={formValues[s.setting_key] || '1'}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [s.setting_key]: e.target.value })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="1">Enabled (Members can edit phone and address)</option>
                          <option value="0">Disabled (Contact details locked by administration)</option>
                        </select>
                      ) : s.setting_key === 'org_fund_status' ? (
                        <select
                          value={formValues[s.setting_key] || 'Not Configured'}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [s.setting_key]: e.target.value })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="Not Configured">Not Configured (Requires verified physical opening balance)</option>
                          <option value="Active">Active (Computed strictly from recorded fund income & expenses)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formValues[s.setting_key] ?? ''}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [s.setting_key]: e.target.value })
                          }
                          className="w-full sm:w-96 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    loading={savingKey === s.setting_key}
                    onClick={() => handleUpdate(s.setting_key)}
                    className="self-end sm:self-center"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
