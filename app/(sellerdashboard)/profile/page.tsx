'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Package, TrendingUp, Star, Camera, Upload, Edit, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LoadingDots from '@/components/ui/LoadingDots';
import EditProfileModal from '@/components/ui/EditProfileModal';
import SellerVerification from '@/components/seller/SellerVerification';
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

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  farmName?: string;
  farmDescription?: string;
  createdAt?: string;
  status?: 'active' | 'suspended' | 'deleted';
  suspendReason?: string;
  suspendedAt?: string;
  suspensionExpiresAt?: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  currentStock: number;
  stock: number;
  lowStockAlert: number;
  category: string;
  unit: string;
}

interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
    fetchStats();
    fetchLowStockProducts();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile', {
        credentials: 'include' // Use HTTP-only cookies instead of localStorage
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.seller);
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/seller/stats', {
        credentials: 'include' // Use HTTP-only cookies
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          averageRating: data.averageRating || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/seller/low-stock-products', {
        credentials: 'include' // Use HTTP-only cookies
      });

      if (response.ok) {
        const data = await response.json();
        setLowStockProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error);
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

      const response = await fetch('/api/seller/upload-profile-image', {
        method: 'POST',
        credentials: 'include', // Use HTTP-only cookies
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

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    // Also update localStorage or trigger a refresh if needed
  };

  // Prevent hydration mismatch - only show loading on client
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#103C2E" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading seller profile
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
            Seller Profile
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

      {/* Suspension Banner */}
      {profile?.status === 'suspended' && (
        <SuspensionBanner 
          reason={profile.suspendReason}
          suspendedAt={profile.suspendedAt}
          suspensionExpiresAt={profile.suspensionExpiresAt}
        />
      )}

        {/* Profile Header with Avatar */}
        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <div className="flex items-center gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : profile?.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.name}
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4" />
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
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#103C2E] mb-1">
                {loading ? 'Loading...' : profile?.name || 'Unknown User'}
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
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : `₱${stats?.totalRevenue?.toLocaleString() || '0'}`}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products Sold</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : (stats?.productsSold || 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-[#103C2E]" />
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
              <Package className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-[#103C2E]">
                  {loadingStats ? '...' : (stats?.averageRating?.toFixed(1) || '0.0')}
                </p>
              </div>
              <Star className="w-8 h-8 text-[#103C2E]" />
            </div>
          </Card>
        </div>

        {/* Seller Verification Section */}
        <div className="mb-6">
          <SellerVerification onStatusChange={fetchProfile} />
        </div>

        {/* Profile Information */}
        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-[#103C2E] mb-4">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : profile?.name || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : profile?.email || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : profile?.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Address</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : profile?.address || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Member Since</label>
              <p className="font-medium text-gray-900">
                {loading ? 'Loading...' : formatDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-[#103C2E]">
              Low Stock Alert
            </h2>
            {lowStockProducts.length > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                {lowStockProducts.length} items
              </Badge>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="space-y-2 flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <h3 className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      SKU: {product.sku} • Alert when below {product.lowStockAlert} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {product.currentStock} {product.unit}
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      Low Stock
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <Button 
                  className="w-full bg-[#103C2E] hover:bg-[#0d2e23] text-white" 
                  onClick={() => window.location.href = '/products'}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage Products
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              {stats?.totalProducts === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Products Listed Yet
                  </h3>
                  <p className="text-gray-600">
                    You haven't added any products yet. Start by adding your first product!
                  </p>
                  <div className="mt-4">
                    <Button 
                      className="bg-[#103C2E] hover:bg-[#0d2e23] text-white" 
                      onClick={() => window.location.href = '/products'}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    All Products Well Stocked
                  </h3>
                  <p className="text-gray-600">
                    No products are currently running low on stock. Great job!
                  </p>
                </>
              )}
            </div>
          )}
        </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />

    </div>
  );
}
