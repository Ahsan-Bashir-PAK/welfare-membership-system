'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from './api';

export type UserRole = 'Super Admin' | 'Focal Person' | 'User';

export interface UserProfile {
  id: number;
  cnic: string;
  role: UserRole;
  status: 'Active' | 'Disable';
  name: string;
  memberId?: string;
  memberProfileId?: number;
  membershipStatus?: 'Active' | 'Disable';
  rankName?: string;
  fatherName?: string;
  posting?: string;
  address?: string;
  zoneName?: string;
  sectorName?: string;
  beatName?: string;
  contact?: string;
  dateOfBirth?: string;
  membershipDate?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (cnic: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isSuperAdmin: boolean;
  isFocalPerson: boolean;
  isRegularUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (cnic: string, pass: string) => {
    try {
      const res = await api.post('/auth/login', { cnic, password: pass });
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const isSuperAdmin = user?.role === 'Super Admin';
  const isFocalPerson = user?.role === 'Focal Person';
  const isRegularUser = user?.role === 'User';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isSuperAdmin,
        isFocalPerson,
        isRegularUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
