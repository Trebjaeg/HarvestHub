'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';
import { useRecentActivities } from '../../../hooks/useRecentActivities';
import { StatCardSkeleton, ActivitySkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoader';
import { getAuthHeaders } from '../../../lib/admin-auth';
import UserManagement from '../UserManagement';
import FarmerManagement from '../FarmerManagement';
import FarmerVerification from '../FarmerVerification';
import Reports from '../Reports';
import Appeals from '../Appeals';
import AuditLogs from '../AuditLogs';
import AdsManagement from '../AdsManagement';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  pendingFarmers: number;
  totalReports: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true); // Initial loading
  const [refreshing, setRefreshing] = useState(false); // Refresh loading
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch recent activities
  const { activities, loading: activitiesLoading, error: activitiesError, refetch: refetchActivities } = useRecentActivities(5);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Process activity data for chart
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    
    // Group activities by date
    const grouped: { [key: string]: number } = {};
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    
    // Convert to array and sort by date
    return Object.entries(grouped).map(([date, count]) => ({
      date,
      activities: count
    })).reverse().slice(0, 7); // Show last 7 days
  }, [activities]);

  // Unified refresh function for all dashboard data
  const refreshDashboard = async () => {
    await Promise.all([
      fetchStats(true), // Pass true to indicate this is a refresh
      refetchActivities()
    ]);
  };

  const handleLogout = async () => {
    console.log('🚪 [ADMIN] Starting logout process...');
    try {
      // Call logout API to clear server-side session
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      console.log('🚪 [ADMIN] Logout API response:', response.status);
      
      // Clear ALL possible storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('hh_token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('userToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_user');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Trigger logout event for other tabs
        localStorage.setItem('logout-event', Date.now().toString());
        localStorage.removeItem('logout-event');
        
        console.log('🚪 [ADMIN] Cleared all storage');
      }
      
    } catch (error) {
      console.error('🚪 [ADMIN] Logout error:', error);
    } finally {
      console.log('🚪 [ADMIN] Redirecting to auth page...');
      
      // Force a complete page reload to clear any cached state
      window.location.href = '/auth';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading Dashboard
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Dashboard Error
          </h3>
          <p className="text-red-600 mb-6 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-bold"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to format audit log actions for display
  const formatActivityAction = (action: string, targetUser?: any, targetResource?: string): string => {
    const actionMap: { [key: string]: string } = {
      'user_suspended': 'User suspended',
      'user_unsuspended': 'User unsuspended',
      'user_deleted': 'User deleted',
      'user_warned': 'User warned',
      'user_role_changed': 'User role changed',
      'user_token_invalidated': 'User token invalidated',
      'appeal_submitted': 'New appeal submitted',
      'appeal_approved': 'Appeal approved',
      'appeal_rejected': 'Appeal rejected',
      'listing_hidden': targetResource ? `Hidden listing: ${targetResource}` : 'Listing hidden',
      'listing_restored': targetResource ? `Restored listing: ${targetResource}` : 'Listing restored',
      'admin_login': 'Admin login',
      'admin_action_failed': 'Admin action failed'
    };
    
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get activity status/severity color
  const getActivityStatusColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper function to get activity type from action
  const getActivityType = (action: string): string => {
    if (action.includes('user')) return 'user';
    if (action.includes('farmer')) return 'farmer';
    if (action.includes('appeal')) return 'appeal';
    if (action.includes('listing')) return 'listing';
    if (action.includes('admin')) return 'admin';
    return 'system';
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 6l16 0" />
              <path d="M4 12l16 0" />
              <path d="M4 18l16 0" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              HarvestHub Management
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mobile Profile Icon */}
          <button
            onClick={() => router.push('/admin-profile')}
            className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC] transition-colors"
            title="Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          </button>
          
          {/* Mobile Home Button */}
          <Button
            onClick={() => {
              console.log('Mobile Home button clicked');
              router.push('/home');
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            variant="outline"
            size="sm"
            className="relative z-50 border-gray-200 hover:border-[#D2B48C] hover:bg-[#F5F5DC] text-gray-600 hover:text-[#8B7355] transition-colors font-medium min-h-[40px] px-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
              <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
            </svg>
            Home
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 backdrop-blur-sm bg-white/20 z-40 top-0 left-0 w-full h-full"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Top Navigation Bar */}
        <div className="hidden lg:block bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                HarvestHub Management
              </p>
            </div>
          <div className="flex items-center space-x-3">
            {/* Desktop Profile Icon */}
            <button
              onClick={() => router.push('/admin-profile')}
              className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC] transition-colors"
              title="Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
              </svg>
            </button>
            
            <Button
              onClick={() => router.push('/home')}
              variant="outline"
              className="border-gray-200 hover:border-[#D2B48C] hover:bg-[#F5F5DC] text-gray-600 hover:text-[#8B7355] transition-colors font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
              </svg>
              Home
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static lg:translate-x-0 z-50 w-64 h-full lg:h-auto bg-white shadow-lg lg:shadow-sm border-r transition-transform duration-300 ease-in-out flex flex-col lg:min-h-screen top-0 left-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  HarvestHub Management
                </p>
              </div>
              
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
            <nav className="space-y-2">
              {[
                { 
                  id: 'overview', 
                  label: 'Overview', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-layout-dashboard">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 3a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2zm10 -4a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 -8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z" />
                    </svg>
                  )
                },
                { 
                  id: 'users', 
                  label: 'Users', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-users">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                    </svg>
                  )
                },
                { 
                  id: 'farmers', 
                  label: 'Farmers', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-tractor">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M7 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M7 15l0 .01" />
                      <path d="M19 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                      <path d="M10.5 17l6.5 0" />
                      <path d="M20 15.2v-4.2a1 1 0 0 0 -1 -1h-6l-2 -5h-6v6.5" />
                      <path d="M18 5h-1a1 1 0 0 0 -1 1v4" />
                    </svg>
                  )
                },
                { 
                  id: 'farmers-verification', 
                  label: 'Verification', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-scan">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M10 9a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
                      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                      <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
                      <path d="M8 16a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2" />
                    </svg>
                  )
                },
                { 
                  id: 'reports', 
                  label: 'Reports', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-report">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M8 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h5.697" />
                      <path d="M18 14v4h4" />
                      <path d="M18 11v-4a2 2 0 0 0 -2 -2h-2" />
                      <path d="M8 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                      <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M8 11h4" />
                      <path d="M8 15h3" />
                    </svg>
                  )
                },
                { 
                  id: 'ads', 
                  label: 'Ads Management', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-ad">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                      <path d="M7 15v-4a2 2 0 0 1 4 0v4" />
                      <path d="M7 13l4 0" />
                      <path d="M17 9v6h-1.5a1.5 1.5 0 1 1 1.5 -1.5" />
                    </svg>
                  )
                },
                { 
                  id: 'appeals', 
                  label: 'Appeals', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-scale">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M7 20l10 0" />
                      <path d="M6 6l6 -1l6 1" />
                      <path d="M12 3l0 17" />
                      <path d="M9 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
                      <path d="M21 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
                    </svg>
                  )
                },
                { 
                  id: 'audit', 
                  label: 'Audit Logs', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-search">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M12 21h-5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4.5" />
                      <path d="M16.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" />
                      <path d="M18.5 19.5l2.5 2.5" />
                    </svg>
                  )
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${
                    activeTab === item.id
                      ? 'bg-[#F5F5DC] text-[#8B7355] border border-[#D2B48C]'
                      : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#8B7355]'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <span className={`${typeof item.icon === 'string' ? 'text-lg' : ''}`}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Logout Button at Bottom of Sidebar */}
          <div className="p-4 lg:p-6 border-t border-gray-200">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                <path d="M9 12h12l-3 -3" />
                <path d="M18 15l3 -3" />
              </svg>
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 p-4 lg:p-6">
          {/* Desktop Page Header - Only for Overview */}
          {activeTab === 'overview' && (
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Dashboard Overview
              </h2>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {refreshing ? (
                  // Show skeleton loading during refresh
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  // Show actual stats cards
                  <>
                    <Card className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs lg:text-sm font-bold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Total Users
                          </CardTitle>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="lg:w-4 lg:h-4 icon icon-tabler icons-tabler-filled icon-tabler-user text-blue-600">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                              <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                            </svg>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {stats?.totalUsers ?? 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs lg:text-sm font-bold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Total Farmers
                          </CardTitle>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lg:w-4 lg:h-4 icon icon-tabler icons-tabler-outline icon-tabler-brand-databricks text-green-600">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M3 17l9 5l9 -5v-3l-9 5l-9 -5v-3l9 5l9 -5v-3l-9 5l-9 -5l9 -5l5.418 3.01" />
                            </svg>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {stats?.totalFarmers ?? 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs lg:text-sm font-bold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Pending Verification
                          </CardTitle>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lg:w-4 lg:h-4 icon icon-tabler icons-tabler-outline icon-tabler-clock-check text-orange-600">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M20.942 13.021a9 9 0 1 0 -9.407 7.967" />
                              <path d="M12 7v5l3 3" />
                              <path d="M15 19l2 2l4 -4" />
                            </svg>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {stats?.pendingFarmers ?? 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs lg:text-sm font-bold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Active Reports
                          </CardTitle>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="lg:w-4 lg:h-4 icon icon-tabler icons-tabler-filled icon-tabler-pennant text-red-600">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M10 2a1 1 0 0 1 .993 .883l.007 .117v.35l8.406 3.736c.752 .335 .79 1.365 .113 1.77l-.113 .058l-8.406 3.735v7.351h1a1 1 0 0 1 .117 1.993l-.117 .007h-4a1 1 0 0 1 -.117 -1.993l.117 -.007h1v-17a1 1 0 0 1 1 -1z" />
                            </svg>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {stats?.totalReports ?? 0}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Activity Chart Area */}
              <Card className="bg-white rounded-xl shadow-sm border">
                <CardHeader className="pb-3 lg:pb-4">
                  <div className="flex items-center justify-between flex-col lg:flex-row space-y-2 lg:space-y-0">
                    <CardTitle className="text-base lg:text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Activity Trend</CardTitle>
                    <Button
                      onClick={refreshDashboard}
                      variant="outline"
                      size="sm"
                      disabled={refreshing || activitiesLoading}
                      className="w-full lg:w-auto lg:ml-2"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {(refreshing || activitiesLoading) ? (
                        <LoadingDots />
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {refreshing ? (
                    <ChartSkeleton />
                  ) : chartData.length === 0 ? (
                    <div className="h-48 lg:h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>
                        </svg>
                        <p style={{ fontFamily: 'Poppins, sans-serif' }}>No activity data available yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 lg:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#103C2E" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#103C2E" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}
                            stroke="#888"
                          />
                          <YAxis 
                            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}
                            stroke="#888"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              fontFamily: 'Poppins, sans-serif',
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="activities" 
                            stroke="#103C2E" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorActivities)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity List */}
              <Card className="bg-white rounded-xl shadow-sm border">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Latest Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <ActivitySkeleton />
                  ) : activitiesError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Error loading activities: {activitiesError}
                      </p>
                      <Button
                        onClick={refetchActivities}
                        variant="outline"
                        size="sm"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        No recent activities found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 lg:space-y-4">
                      {activities.map((activity) => (
                        <div key={activity._id} className="flex items-start justify-between py-3 border-b last:border-b-0 flex-col space-y-2">
                          <div className="flex items-start space-x-3 w-full">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getActivityStatusColor(activity.severity)}`}></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 text-sm lg:text-base break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {formatActivityAction(activity.action, activity.targetUser, activity.targetResource)}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs lg:text-sm text-gray-600 mt-1">
                                <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  By: <span className="font-medium text-gray-800">
                                    {activity.performedBy?.firstName && activity.performedBy?.lastName
                                      ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}`
                                      : activity.performedBy?.email || 'System'}
                                  </span>
                                </span>
                                <span className="hidden sm:inline text-gray-400">•</span>
                                <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {new Date(activity.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                              {activity.targetUser && (
                                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Target: <span className="font-medium">
                                    {activity.targetUser.firstName && activity.targetUser.lastName
                                      ? `${activity.targetUser.firstName} ${activity.targetUser.lastName} (${activity.targetUser.email})`
                                      : activity.targetUser.email}
                                  </span>
                                </p>
                              )}
                              {activity.reason && (
                                <p className="text-xs text-gray-400 mt-1 break-words italic" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Reason: {activity.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0 self-end">
                            {getActivityType(activity.action)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'farmers' && <FarmerManagement />}
          {activeTab === 'farmers-verification' && <FarmerVerification />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'ads' && <AdsManagement />}
          {activeTab === 'appeals' && <Appeals />}
          {activeTab === 'audit' && <AuditLogs />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;