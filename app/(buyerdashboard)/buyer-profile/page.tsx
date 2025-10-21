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
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  const getDefaultAvatar = (firstName: string, lastName: string) => {
    // Generate initials from first and last name
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    
    // Generate a color based on the name (like Facebook)
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    const colorIndex = (firstName.length + lastName.length) % colors.length;
    const bgColor = colors[colorIndex];
    
    return { initials, bgColor };
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-6">
            <Link 
              href="/home" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link 
              href="/buyer-messages" 
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <MessageSquare className="w-5 h-5" />
              Messages
            </Link>
            <Link 
              href="/buyer-help" 
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <HelpCircle className="w-5 h-5" />
              Help Center
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Buyer Profile
            </h1>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white" style={{ fontFamily: 'Poppins, sans-serif' }} onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Header with Avatar */}
        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <div className="flex items-center gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
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
                ) : profile ? (
                  <div className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${getDefaultAvatar(profile.firstName, profile.lastName).bgColor}`}>
                    {getDefaultAvatar(profile.firstName, profile.lastName).initials}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : fullName || 'Unknown User'}
              </h2>
              <p className="text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.email || 'No email provided'}
              </p>
              <Badge className="bg-blue-100 text-blue-800">Verified Buyer</Badge>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Spent</p>
                <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : `₱${stats?.totalSpent?.toLocaleString() || '0'}`}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Orders</p>
                <p className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : (stats?.totalOrders || 0)}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Favorite Products</p>
                <p className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : (stats?.favoriteProducts || 0)}
                </p>
              </div>
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : (stats?.averageRating || 0)}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>First Name</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</label>
              <Badge className="bg-green-100 text-green-800">Active Buyer</Badge>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Edit Profile Modal */}
        <EditBuyerProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      </div>
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