"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingDots from '@/components/ui/LoadingDots';

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
  permissions: {
    canAccessSellerFeatures: boolean;
    canAccessBuyerFeatures: boolean;
    canAccessAdminFeatures: boolean;
    isSuperAdmin: boolean;
  };
  dashboardRoute: string;
}

/**
 * ProfileRouter component
 * Fetches authoritative user role from server and routes to appropriate dashboard
 * 
 * Usage: Navigate to /my-profile and this component will route to correct dashboard:
 * - Seller (verified): → /sellerdashboard (can also access buyer features)
 * - Buyer: → /buyer-profile (cannot access seller features)
 * - Admin/Superadmin: → /admin
 * 
 * Role is fetched from database server-side, NOT from client or JWT claims
 */
export default function ProfileRouter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndRoute = async () => {
      try {
        setLoading(true);
        
        // Fetch authoritative profile data from server
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to login
            router.push('/auth');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data: ProfileData = await response.json();
        
        console.log('🔐 ProfileRouter: User role:', data.user.role);
        console.log('🔐 ProfileRouter: Dashboard route:', data.dashboardRoute);
        console.log('🔐 ProfileRouter: Permissions:', data.permissions);

        // Route to the appropriate dashboard based on role
        router.push(data.dashboardRoute);
        
      } catch (err) {
        console.error('ProfileRouter error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        // Redirect to auth on error
        setTimeout(() => router.push('/auth'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRoute();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#103C2E" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading your profile
          </h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}
