'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  HeartHandshake,
  ArrowLeftRight,
  FileText,
  ShieldCheck,
  Settings,
  Database,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin, isFocalPerson, isRegularUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const canManageMembers = isSuperAdmin || isFocalPerson;
  const canRecordFinancials = isSuperAdmin || isFocalPerson;

  const NavItem = ({
    href,
    icon: Icon,
    label,
    badge,
  }: {
    href: string;
    icon: any;
    label: string;
    badge?: string;
  }) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors group',
          isActive
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400')} />
          <span>{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-200 border border-blue-400/30">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-3.5 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {title}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 text-white shadow-md"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      {/* Sidebar sidebar element */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Institution Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-tight truncate">
              Institutional Portal
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Membership & Welfare System
            </p>
          </div>
        </div>

        {/* User Role Card inside sidebar */}
        <div className="px-4 py-3 mx-3 my-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized Member'}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.cnic}</p>
          </div>
          <Badge variant={isSuperAdmin ? 'admin' : isFocalPerson ? 'focal' : 'user'}>
            {user?.role}
          </Badge>
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {/* Main Dashboard: Available to Super Admin & Focal Person */}
          {!isRegularUser && (
            <>
              <SectionHeader title="Dashboard" />
              <NavItem href="/dashboard" icon={LayoutDashboard} label="System Overview" />
            </>
          )}

          {/* Regular User Portal Dashboard */}
          {isRegularUser && (
            <>
              <SectionHeader title="Member Portal" />
              <NavItem href="/account/profile" icon={User} label="My Profile" />
              <NavItem href="/payments" icon={CreditCard} label="My Payments" />
              <NavItem href="/welfare" icon={HeartHandshake} label="My Welfare Support" />
              <NavItem href="/transfers" icon={ArrowLeftRight} label="My Member Transfers" />
            </>
          )}

          {/* Member Management: Super Admin and Focal Person */}
          {canManageMembers && (
            <>
              <SectionHeader title="Member Directory" />
              <NavItem href="/members" icon={Users} label="All Members" />
              <NavItem href="/members/add" icon={UserPlus} label="Register Member" />
            </>
          )}

          {/* Focal Persons Section: Super Admin Only */}
          {isSuperAdmin && (
            <>
              <SectionHeader title="Focal Persons" />
              <NavItem href="/admin/focal-persons" icon={ShieldCheck} label="Focal Officers" />
            </>
          )}

          {/* Financial Registers: Super Admin & Focal Person */}
          {canRecordFinancials && (
            <>
              <SectionHeader title="Financial Registers" />
              <NavItem href="/payments" icon={CreditCard} label="Payment Collection" />
              <NavItem href="/payments/add" icon={CreditCard} label="Record Payment" />
              <NavItem href="/welfare" icon={HeartHandshake} label="Welfare Disbursements" />
              <NavItem href="/welfare/add" icon={HeartHandshake} label="Add Welfare Support" />
              <NavItem href="/transfers" icon={ArrowLeftRight} label="Transfer Register" badge="Record Only" />
              <NavItem href="/transfers/add" icon={ArrowLeftRight} label="Record Transfer" />
            </>
          )}

          {/* Reports: Super Admin & Focal Person */}
          {canRecordFinancials && (
            <>
              <SectionHeader title="Institutional Reports" />
              <NavItem href="/reports" icon={FileText} label="Reports & Exports" />
            </>
          )}

          {/* Administration Section: Super Admin Only */}
          {isSuperAdmin && (
            <>
              <SectionHeader title="Administration" />
              <NavItem href="/admin/audit-logs" icon={ShieldAlert} label="Audit Logs" />
              <NavItem href="/admin/master-data" icon={Database} label="Master Data" />
              <NavItem href="/admin/settings" icon={Settings} label="System Settings" />
            </>
          )}

          {/* User Account */}
          <SectionHeader title="My Account" />
          <NavItem href="/account/profile" icon={User} label="My Profile" />
          <NavItem href="/account/change-password" icon={KeyRound} label="Change Password" />
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
