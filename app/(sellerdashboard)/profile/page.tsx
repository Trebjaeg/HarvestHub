'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Package, TrendingUp, Star, Camera, Upload, Edit, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import EditProfileModal from '@/components/ui/EditProfileModal';

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
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchLowStockProducts();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.seller);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/stats', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/low-stock-products', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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

      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/upload-profile-image', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

  const getDefaultAvatar = (name: string) => {
    // Generate initials from name
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
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
    
    const colorIndex = name.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return { initials, bgColor };
  };

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    // Also update localStorage or trigger a refresh if needed
  };
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Seller Profile
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
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : profile ? (
                  <div className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${getDefaultAvatar(profile.name).bgColor}`}>
                    {getDefaultAvatar(profile.name).initials}
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
                {loading ? 'Loading...' : profile?.name || 'Unknown User'}
              </h2>
              <p className="text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.email || 'No email provided'}
              </p>
              <Badge className="bg-green-100 text-green-800">Active Seller</Badge>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Revenue</p>
                <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : `₱${stats?.totalRevenue?.toLocaleString() || '0'}`}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
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
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Products Listed</p>
                <p className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loadingStats ? '...' : (stats?.totalProducts || 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
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
        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Name</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.name || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Email</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.email || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Phone</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Address</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.address || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Member Since</label>
              <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loading ? 'Loading...' : profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</label>
              <Badge className="bg-green-100 text-green-800">Active Seller</Badge>
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                  style={{ fontFamily: 'Poppins, sans-serif' }}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    No Products Listed Yet
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    You haven't added any products yet. Start by adding your first product!
                  </p>
                  <div className="mt-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white" 
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                      onClick={() => window.location.href = '/products'}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    All Products Well Stocked
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
    </div>
  );
}
