'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ShoppingBag, Heart, Star, Camera, Edit, Home, MessageSquare, HelpCircle, LogOut, Trash2, Pencil } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EditBuyerProfileModal from '@/components/ui/EditBuyerProfileModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoadingDots from '@/components/ui/LoadingDots';
import AppealStatusCard from '@/components/AppealStatusCard';
import SuspensionBanner from '@/components/SuspensionBanner';

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
  addresses?: Array<{
    _id: string;
    label: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    zipCode?: string;
    isDefault: boolean;
    type: 'delivery' | 'pickup' | 'both';
  }>;
  profileImage?: string;
  createdAt?: string;
  status?: 'active' | 'suspended' | 'deleted';
  suspendReason?: string;
  suspendedAt?: string;
  suspensionExpiresAt?: string;
}

interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  averageRating: number;
  totalReviews?: number;
}

interface Review {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sellerResponse?: {
    comment: string;
    respondedAt: string;
  };
}

function BuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfileData | null>(null);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ rating: 5, title: '', comment: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
    fetchStats();
    fetchReviews();
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
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/buyer/reviews', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review._id);
    setEditFormData({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment
    });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditFormData({ rating: 5, title: '', comment: '' });
  };

  const handleUpdateReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/buyer/reviews/${reviewId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        await fetchReviews();
        await fetchStats();
        setEditingReview(null);
        setEditFormData({ rating: 5, title: '', comment: '' });
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/buyer/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchReviews();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const { uploadProfileImage } = await import('@/lib/image-upload');
      
      const result = await uploadProfileImage(file, (progress) => {
        console.log('Upload progress:', progress);
      });

      if (result.success && result.imageUrl) {
        setProfile(prev => prev ? { ...prev, profileImage: result.imageUrl! } : null);
      } else {
        alert(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      console.log('🚪 [BUYER] Redirecting to landing page...');
      
      // Force a complete page reload to clear any cached state
      window.location.href = '/';
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
    <div className="w-full max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <User className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#103C2E] flex-shrink-0" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#103C2E] truncate">
            Buyer Profile
          </h1>
        </div>
        <Button 
          className="bg-[#103C2E] hover:bg-[#0d2e23] text-white w-full sm:w-auto touch-manipulation" 
          onClick={() => setShowEditModal(true)}
        >
          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">Edit Profile</span>
        </Button>
      </div>

      {/* Suspension Banner */}
      {profile?.status === 'suspended' && (
        <div className="mb-4 sm:mb-6">
          <SuspensionBanner 
            reason={profile.suspendReason}
            suspendedAt={profile.suspendedAt}
            suspensionExpiresAt={profile.suspensionExpiresAt}
          />
        </div>
      )}

      {/* Appeal Status Card */}
      <div className="mb-4 sm:mb-6">
        <AppealStatusCard />
      </div>

      {/* Profile Header with Avatar */}
      <Card className="p-4 sm:p-6 bg-white border border-gray-200 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Profile Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-12 h-12 sm:w-16 sm:h-16">
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
                className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-[#103C2E] hover:bg-[#0d2e23] rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50 touch-manipulation"
              >
                {uploadingImage ? (
                  <svg viewBox="0 0 60 15" className="w-4 h-2 sm:w-6 sm:h-3" xmlns="http://www.w3.org/2000/svg">
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
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#103C2E] mb-1 truncate">
                {loading ? 'Loading...' : fullName || 'Unknown User'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                {loading ? 'Loading...' : profile?.email || 'No email provided'}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card className="p-4 sm:p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#103C2E] truncate">
                  {loadingStats ? '...' : (stats?.totalOrders || 0)}
                </p>
              </div>
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E] flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Favorite Products</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#103C2E] truncate">
                  {loadingStats ? '...' : (stats?.favoriteProducts || 0)}
                </p>
              </div>
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E] flex-shrink-0" />
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">My Avg Rating</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#103C2E] truncate">
                  {loadingStats ? '...' : (stats?.averageRating || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stats?.totalReviews || 0} reviews
                </p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E] flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="p-4 sm:p-6 bg-white border border-gray-200 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-[#103C2E] mb-3 sm:mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>First Name</label>
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.firstName || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Last Name</label>
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.lastName || 'Not provided'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Email</label>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate min-w-0 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : profile?.email || 'Not provided'}
                </p>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm flex-shrink-0 touch-manipulation">
                  <span className="hidden sm:inline">Edit Email</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Phone Number</label>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate min-w-0 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : profile?.phone || 'Not provided'}
                </p>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm flex-shrink-0 touch-manipulation">
                  <span className="hidden sm:inline">Edit Number</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-2 gap-2">
                <label className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Saved Addresses</label>
                <Link href="/buyer-addresses">
                  <Button variant="outline" size="sm" className="text-[#4A7C59] border-[#4A7C59] hover:bg-[#4A7C59]/10 text-xs sm:text-sm touch-manipulation">
                    <span className="hidden sm:inline">Manage Addresses</span>
                    <span className="sm:hidden">Manage</span>
                  </Button>
                </Link>
              </div>
              {loading ? (
                <p className="font-medium text-gray-900 text-sm sm:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
              ) : profile?.addresses && profile.addresses.length > 0 ? (
                <div className="space-y-2">
                  {profile.addresses.map((addr) => (
                    <div 
                      key={addr._id} 
                      className={`p-3 border rounded-lg ${addr.isDefault ? 'border-[#4A7C59] bg-[#4A7C59]/5' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {addr.label}
                            </p>
                            {addr.isDefault && (
                              <Badge className="bg-[#4A7C59] text-white text-xs">Default</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {addr.type === 'delivery' ? 'Delivery' : addr.type === 'pickup' ? 'Pickup' : 'Both'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {addr.fullName} • {addr.phone}
                          </p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {addr.street}, {addr.city}, {addr.province} {addr.zipCode || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    No saved addresses yet
                  </p>
                  <Link href="/buyer-addresses">
                    <Button size="sm" className="bg-[#4A7C59] hover:bg-[#3d6549]">
                      Add Address
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Member Since</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* My Reviews Section */}
        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
              <Star className="w-5 h-5" />
              My Reviews
              {stats?.totalReviews ? (
                <Badge className="bg-[#4A7C59] text-white">{stats.totalReviews}</Badge>
              ) : null}
            </h2>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-8">
              <LoadingDots size="md" color="#4A7C59" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                You haven't written any reviews yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                  {editingReview === review._id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setEditFormData({ ...editFormData, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= editFormData.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                          placeholder="Summary of your experience"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                        <textarea
                          value={editFormData.comment}
                          onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                          placeholder="Share your experience..."
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateReview(review._id)}
                          className="bg-[#4A7C59] hover:bg-[#3d6549]"
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start gap-4 mb-3">
                        {review.productImage && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={review.productImage}
                              alt={review.productName}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <Link href={`/product/${review.productId}`} className="hover:underline">
                            <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {review.productName}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {review.title}
                            </h4>
                          )}
                          <p className="text-gray-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {review.comment}
                          </p>

                          {review.sellerResponse && (
                            <div className="bg-gray-50 border-l-4 border-[#4A7C59] p-3 rounded mt-3">
                              <p className="text-sm font-medium text-gray-900 mb-1">Seller Response:</p>
                              <p className="text-sm text-gray-700">{review.sellerResponse.comment}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {review.status === 'active' && review.productId && (
                        <div className="flex gap-2 justify-end">
                          <Link href={`/product/${review.productId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#4A7C59] border-[#4A7C59] hover:bg-[#4A7C59]/10"
                            >
                              View Product & Add Follow-up
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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