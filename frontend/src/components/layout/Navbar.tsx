'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/Badge';
import { LogOut, User, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function Navbar({ title }: { title?: string }) {
  const { user, logout, isSuperAdmin, isFocalPerson } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6 shadow-2xs">
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {title || 'Institutional Management Portal'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Verification Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Session Verified</span>
        </div>

        {/* Profile Pill */}
        <Link
          href="/account/profile"
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-slate-200/80 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left text-xs leading-tight">
            <p className="font-semibold text-slate-800">{user?.name || 'Authorized Member'}</p>
            <p className="text-[11px] text-slate-500 font-mono">{user?.cnic}</p>
          </div>
          <Badge variant={isSuperAdmin ? 'admin' : isFocalPerson ? 'focal' : 'user'}>
            {user?.role}
          </Badge>
        </Link>

        {/* Logout Quick Action */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
