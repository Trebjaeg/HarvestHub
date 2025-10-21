"use client";

import { useState, useEffect } from 'react';

interface UserPermissions {
  canAccessSellerFeatures: boolean;
  canAccessBuyerFeatures: boolean;
  canAccessAdminFeatures: boolean;
  isSuperAdmin: boolean;
}

interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    sellerStatus: string;
    status: string;
    profileImage?: string;
  };
  permissions: UserPermissions;
  dashboardRoute: string;
}

/**
 * Hook to check user role and permissions
 * Fetches authoritative role from server, never trusts client-side data
 */
export function useRoleCheck() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data: ProfileData = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return {
    user: profile?.user || null,
    permissions: profile?.permissions || {
      canAccessSellerFeatures: false,
      canAccessBuyerFeatures: false,
      canAccessAdminFeatures: false,
      isSuperAdmin: false,
    },
    dashboardRoute: profile?.dashboardRoute || '/auth',
    loading,
    error,
  };
}

/**
 * Hook to check if user can access seller features
 */
export function useCanAccessSeller() {
  const { permissions, loading } = useRoleCheck();
  return {
    canAccessSeller: permissions.canAccessSellerFeatures,
    loading,
  };
}

/**
 * Hook to check if user can access buyer features
 */
export function useCanAccessBuyer() {
  const { permissions, loading } = useRoleCheck();
  return {
    canAccessBuyer: permissions.canAccessBuyerFeatures,
    loading,
  };
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { permissions, loading } = useRoleCheck();
  return {
    isAdmin: permissions.canAccessAdminFeatures,
    loading,
  };
}

/**
 * Hook to check if user is superadmin
 */
export function useIsSuperAdmin() {
  const { permissions, loading } = useRoleCheck();
  return {
    isSuperAdmin: permissions.isSuperAdmin,
    loading,
  };
}
