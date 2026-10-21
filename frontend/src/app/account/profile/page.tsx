'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User, Phone, MapPin, Building, Calendar, Shield, Save, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function MyProfilePage() {
  const { user, refreshUser } = useAuth();
  const [contact, setContact] = useState(user?.contact || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.memberProfileId) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await api.put(`/members/${user.memberProfileId}`, {
        contact,
        address,
      });
      setStatusMsg('Contact details updated successfully.');
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to update contact details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout title="My Institutional Profile">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>My Personal Dossier & Account Record</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified institutional membership profile and contact information.
          </p>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Member Profile Overview */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-lg">
          <div className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-2xl shadow-md border border-white/10">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <Badge variant={user?.role === 'Super Admin' ? 'admin' : user?.role === 'Focal Person' ? 'focal' : 'user'}>
                  {user?.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                CNIC: {user?.cnic} &bull; Member ID: <span className="text-blue-300 font-bold">{user?.memberId || 'N/A'}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {user?.rankName || 'Member'} &bull; {user?.posting || 'Jurisdiction Assigned'}
              </p>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader title="Official Institutional Records" />
          <CardBody className="p-5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Account Status</span>
                <p className="font-semibold text-slate-900 mt-0.5">{user?.status}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Membership Status</span>
                <p className="font-semibold text-slate-900 mt-0.5">{user?.membershipStatus || 'Active'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Jurisdiction Zone</span>
                <p className="font-semibold text-slate-900 mt-0.5">{user?.zoneName || 'Assigned Zone'}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Sector & Beat</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {user?.sectorName || 'Sector'} &bull; {user?.beatName || 'Beat'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Date of Birth</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDate(user?.dateOfBirth)}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Membership Effective Date</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDate(user?.membershipDate)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Edit Contact Information Form */}
        <Card>
          <CardHeader
            title="Update Contact Details"
            subtitle="Permitted update of contact phone number and residential postal address."
          />
          <CardBody className="p-6">
            <form onSubmit={handleUpdateContact} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Postal Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter current residential address..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md" loading={isSaving}>
                  <Save className="w-4 h-4" />
                  <span>Save Contact Details</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
