'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ShoppingBag, Heart, Star, Camera, Edit, Home, MessageSquare, HelpCircle, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EditBuyerProfileModal from '@/components/ui/EditBuyerProfileModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoadingDots from '@/components/ui/LoadingDots';

// Helper function to safely format dates on client-side only
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return 'Unknown';
  }
};

interface BuyerProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  createdAt?: string;
}

interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  averageRating: number;
}

function BuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfileData | null>(null);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      // Don't try to get token from localStorage - rely on HttpOnly cookies
      const response = await fetch('/api/buyer/profile', {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.buyer);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Don't try to get token from localStorage - rely on HttpOnly cookies
      const response = await fetch('/api/buyer/stats', {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          favoriteProducts: data.favoriteProducts || 0,
          averageRating: data.averageRating || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      // Don't try to get token from localStorage - rely on HttpOnly cookies
      const response = await fetch('/api/buyer/upload-profile-image', {
        method: 'POST',
        credentials: 'include', // This ensures cookies are sent
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, profileImage: data.imageUrl } : null);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: BuyerProfileData) => {
    setProfile(updatedProfile);
  };

  const handleLogout = async () => {
    console.log('🚪 [BUYER] Starting logout process...');
    try {
      // Call logout API to clear server-side session
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🚪 [BUYER] Logout API response:', response.status);
      
      // Clear ALL possible storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('hh_token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_user');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Trigger logout event for other tabs
        localStorage.setItem('logout-event', Date.now().toString());
        localStorage.removeItem('logout-event');
        
        console.log('🚪 [BUYER] Cleared all storage');
      }
      
    } catch (error) {
      console.error('🚪 [BUYER] Logout error:', error);
    } finally {
      console.log('🚪 [BUYER] Redirecting to auth page...');
      
      // Force a complete page reload to clear any cached state
      window.location.href = '/auth';
    }
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

  // Prevent hydration mismatch - only show loading on client
  if (!mounted || loading) {
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

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E]" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#103C2E]">
            Buyer Profile
          </h1>
        </div>
        <Button 
          className="bg-[#103C2E] hover:bg-[#0d2e23] text-white w-full sm:w-auto" 
          onClick={() => setShowEditModal(true)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Header with Avatar */}
      <Card className="p-4 sm:p-6 bg-white border border-gray-200 mb-6">
          <div className="flex items-center gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : profile?.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={fullName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                  </svg>
                )}
              </div>
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#103C2E] hover:bg-[#0d2e23] rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
              >
                {uploadingImage ? (
                  <svg viewBox="0 0 60 15" className="w-6 h-3" xmlns="http://www.w3.org/2000/svg">
                    <circle cx={7.5} cy={7.5} r={3} fill="white">
                      <animate attributeName="cy" dur="0.8s" begin="0s" repeatCount="indefinite" values="7.5;3.75;7.5" keyTimes="0;0.5;1" />
                      <animate attributeName="opacity" dur="0.8s" begin="0s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
                    </circle>
                    <circle cx={22.5} cy={7.5} r={3} fill="white">
                      <animate attributeName="cy" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="7.5;3.75;7.5" keyTimes="0;0.5;1" />
                      <animate attributeName="opacity" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
                    </circle>
                    <circle cx={37.5} cy={7.5} r={3} fill="white">
                      <animate attributeName="cy" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="7.5;3.75;7.5" keyTimes="0;0.5;1" />
                      <animate attributeName="opacity" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
                    </circle>
                  </svg>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#103C2E] mb-1">
                {loading ? 'Loading...' : fullName || 'Unknown User'}
              </h2>
              <p className="text-gray-600">
                {loading ? 'Loading...' : profile?.email || 'No email provided'}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : `₱${stats?.totalSpent?.toLocaleString() || '0'}`}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : (stats?.totalOrders || 0)}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorite Products</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : (stats?.favoriteProducts || 0)}
                </p>
              </div>
              <Heart className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : (stats?.averageRating || 0)}
                </p>
              </div>
              <Star className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-[#103C2E] mb-4">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">First Name</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : profile?.firstName || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Last Name</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.lastName || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Email</label>
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : profile?.email || 'Not provided'}
                </p>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  Edit Email
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Phone Number</label>
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : profile?.phone || 'Not provided'}
                </p>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  Edit Number
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Address</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.address || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Member Since</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Edit Profile Modal */}
        <EditBuyerProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onSave={handleProfileUpdate}
        />
    </div>
  );
}

// Wrap the component with ProtectedRoute
export default function BuyerProfilePage() {
  return (
    <ProtectedRoute>
      <BuyerProfile />
    </ProtectedRoute>
  );
}