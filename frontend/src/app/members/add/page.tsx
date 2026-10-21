'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  ArrowLeft,
  Building2,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const addMemberSchema = z.object({
  cnic: z.string().trim().regex(/^\d{13}$/, 'CNIC must be exactly 13 numeric digits'),
  name: z.string().trim().min(2, 'Full Name is required'),
  fatherName: z.string().trim().min(2, 'Father Name is required'),
  rankName: z.string().trim().min(1, 'Please select a Rank'),
  posting: z.string().trim().min(1, 'Posting location is required'),
  address: z.string().trim().min(3, 'Address is required'),
  zoneName: z.string().trim().min(1, 'Please select a Zone'),
  sectorName: z.string().trim().min(1, 'Please select a Sector'),
  beatName: z.string().trim().min(1, 'Please select a Beat'),
  contact: z.string().trim().min(7, 'Contact number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date of Birth is required'),
  membershipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Membership Date is required'),
  status: z.enum(['Active', 'Disable']),
  accountRole: z.enum(['Super Admin', 'Focal Person', 'User']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

export default function AddMemberPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isFocalPerson } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Data
  const [ranks, setRanks] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [beats, setBeats] = useState<any[]>([]);

  // Selected Zone/Sector IDs for dynamic cascading dropdowns
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      cnic: '',
      name: '',
      fatherName: '',
      rankName: '',
      posting: '',
      address: '',
      zoneName: '',
      sectorName: '',
      beatName: '',
      contact: '',
      dateOfBirth: '',
      membershipDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      accountRole: 'User', // Default role
      password: '',
    },
  });

  // Watch Zone and Sector for cascaded filtering
  const watchedZone = watch('zoneName');
  const watchedSector = watch('sectorName');

  useEffect(() => {
    async function loadMasterData() {
      try {
        const res = await api.get('/master-data');
        if (res.data?.success) {
          setRanks(res.data.data.ranks || []);
          setZones(res.data.data.zones || []);
          setSectors(res.data.data.sectors || []);
          setBeats(res.data.data.beats || []);
        }
      } catch (e) {
        console.error('Failed to load master data', e);
      }
    }
    loadMasterData();
  }, []);

  // Update selectedZoneId when zoneName changes
  useEffect(() => {
    const foundZone = zones.find((z) => z.name === watchedZone);
    if (foundZone) {
      setSelectedZoneId(foundZone.id);
    } else {
      setSelectedZoneId(null);
    }
  }, [watchedZone, zones]);

  // Update selectedSectorId when sectorName changes
  useEffect(() => {
    const foundSector = sectors.find((s) => s.name === watchedSector);
    if (foundSector) {
      setSelectedSectorId(foundSector.id);
    } else {
      setSelectedSectorId(null);
    }
  }, [watchedSector, sectors]);

  const filteredSectors = selectedZoneId
    ? sectors.filter((s) => s.zone_id === selectedZoneId)
    : sectors;

  const filteredBeats = selectedSectorId
    ? beats.filter((b) => b.sector_id === selectedSectorId)
    : beats;

  const onSubmit = async (data: AddMemberForm) => {
    setServerError(null);
    setSuccessMsg(null);

    // Enforce Focal Person restriction: accountRole must be User
    if (isFocalPerson) {
      data.accountRole = 'User';
    }

    // Attach master IDs
    const matchedRank = ranks.find((r) => r.name === data.rankName);
    const matchedZone = zones.find((z) => z.name === data.zoneName);
    const matchedSector = sectors.find((s) => s.name === data.sectorName);
    const matchedBeat = beats.find((b) => b.name === data.beatName);

    const payload = {
      ...data,
      rankId: matchedRank ? matchedRank.id : null,
      zoneId: matchedZone ? matchedZone.id : null,
      sectorId: matchedSector ? matchedSector.id : null,
      beatId: matchedBeat ? matchedBeat.id : null,
      password: data.password || 'Welcome123!',
    };

    try {
      const res = await api.post('/members', payload);
      if (res.data?.success) {
        setSuccessMsg(`Member registered successfully! Assigned Member ID: ${res.data.data.memberId}`);
        setTimeout(() => {
          router.push('/members');
        }, 1500);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to register member');
    }
  };

  return (
    <AppLayout title="Register Institutional Member">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Member Directory</span>
          </Link>
        </div>

        {/* Form Container */}
        <Card>
          <CardHeader
            title="Institutional Member Registration"
            subtitle="Fill in verified identity, departmental assignment, and administrative account details."
          />
          <CardBody className="p-6">
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Personal & Identity Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>1. Personal & Identity Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CNIC */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CNIC (13 Digits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      placeholder="e.g. 1234567890123"
                      {...register('cnic')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.cnic && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.cnic.message}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Tariq"
                      {...register('name')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Father Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ghulam Qadir"
                      {...register('fatherName')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.fatherName && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.fatherName.message}</p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact / Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 03001234567"
                      {...register('contact')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.contact && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.contact.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.dateOfBirth && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Membership Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Membership Effective Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('membershipDate')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.membershipDate && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.membershipDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Residential Address */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter complete permanent residential address"
                    {...register('address')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.address && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.address.message}</p>
                  )}
                </div>
              </div>

              {/* Section 2: Departmental Ranks & Posting */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>2. Departmental Rank & Geographic Jurisdiction</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Rank */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rank <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('rankName')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Rank</option>
                      {ranks.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {errors.rankName && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.rankName.message}</p>
                    )}
                  </div>

                  {/* Posting Location */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Posting / Station <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Field Operations Wing"
                      {...register('posting')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.posting && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.posting.message}</p>
                    )}
                  </div>

                  {/* Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zone <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('zoneName')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                    {errors.zoneName && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.zoneName.message}</p>
                    )}
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sector <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('sectorName')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Sector</option>
                      {filteredSectors.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.sectorName && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.sectorName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Beat */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Beat <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('beatName')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Beat</option>
                      {filteredBeats.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {errors.beatName && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.beatName.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Membership Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Account & Access Privileges */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>3. Account Role & Credentials Policy</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Role <span className="text-rose-500">*</span>
                    </label>
                    {isSuperAdmin ? (
                      <select
                        {...register('accountRole')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="User">Regular User (Member Portal)</option>
                        <option value="Focal Person">Focal Person (Operational Records)</option>
                        <option value="Super Admin">Super Admin (Full Administrative Authority)</option>
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-center justify-between">
                        <span className="font-semibold">User (Read-only for Focal Persons)</span>
                        <span className="text-[10px] text-slate-500">Fixed privilege</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isFocalPerson
                        ? 'Focal Persons can only register regular User members.'
                        : 'Super Admin can designate administrative roles.'}
                    </p>
                  </div>

                  {/* Initial Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for default: Welcome123!"
                      {...register('password')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If left blank, system sets initial password to <code>Welcome123!</code>.
                    </p>
                    {errors.password && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/members')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Member & Create Account</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
