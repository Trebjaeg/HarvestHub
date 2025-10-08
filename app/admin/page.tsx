'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../../components/admin/AdminDashboard';
import LoadingDots from '../../components/ui/LoadingDots';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      console.log('Starting admin access check...');
      
      // Get token from localStorage as fallback for mobile/IP access
      const storedToken = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      console.log('Stored token found:', !!storedToken);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a stored token
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
        console.log('Added Authorization header');
      }
      
      console.log('Making request to /api/auth/check...');
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      console.log('Auth response status:', response.status);
      console.log('Auth response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth check failed:', response.status, response.statusText, errorText);
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Clear any stored tokens
          localStorage.removeItem('hh_token');
          localStorage.removeItem('auth-token');
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/auth');
          }, 2000);
          return;
        }
        
        setError(`Authentication failed: ${response.status} - ${errorText}`);
        return;
      }

      const userData = await response.json();
      console.log('User data received:', userData);
      
      if (!userData.user) {
        console.error('No user data received');
        setError('No user data received. Please log in again.');
        setTimeout(() => {
          router.push('/auth');
        }, 2000);
        return;
      }

      if (userData.user.role !== 'admin' && userData.user.role !== 'superadmin') {
        console.error('User role:', userData.user?.role);
        setError(`Insufficient permissions. Current role: ${userData.user?.role || 'none'}`);
        setTimeout(() => {
          router.push('/auth');
        }, 2000);
        return;
      }

      console.log('Admin access granted for role:', userData.user.role);
      setUserRole(userData.user.role);
      setError(null);
    } catch (error) {
      console.error('Admin access check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error or server unavailable';
      setError(`Access check failed: ${errorMessage}`);
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Verifying Access</h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Checking admin privileges</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Access Denied</h1>
          <p className="text-gray-600 mb-2 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Redirecting to login</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;