import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'disable' | 'posted' | 'draft' | 'reversed' | 'admin' | 'focal' | 'user' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    disable: 'bg-rose-50 text-rose-700 border-rose-200',
    posted: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    reversed: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    focal: 'bg-sky-50 text-sky-700 border-sky-200',
    user: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  // Auto-detect style based on string content if not explicitly specified
  let appliedVariant = variant;
  if (typeof children === 'string' && variant === 'neutral') {
    const val = children.trim().toLowerCase();
    if (val === 'active') appliedVariant = 'active';
    else if (val === 'disable' || val === 'disabled') appliedVariant = 'disable';
    else if (val === 'posted') appliedVariant = 'posted';
    else if (val === 'draft') appliedVariant = 'draft';
    else if (val === 'reversed') appliedVariant = 'reversed';
    else if (val === 'super admin') appliedVariant = 'admin';
    else if (val === 'focal person') appliedVariant = 'focal';
    else if (val === 'user') appliedVariant = 'user';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs',
        styles[appliedVariant] || styles.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
