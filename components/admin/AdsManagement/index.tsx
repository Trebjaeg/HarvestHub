'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingDots from '@/components/ui/LoadingDots';
import { getAuthHeaders } from '../../../lib/admin-auth';
import Image from 'next/image';

interface Banner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl?: string;
  position: 'header' | 'sidebar' | 'footer' | 'content';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
}

const AdsManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUrl: '',
    position: 'header' as Banner['position'],
    startDate: '',
    endDate: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/banners', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !selectedBanner) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('targetUrl', formData.targetUrl);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const url = selectedBanner 
        ? `/api/admin/banners/${selectedBanner._id}` 
        : '/api/admin/banners';
      
      const method = selectedBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          // Don't set Content-Type for FormData
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to save banner');
      }

      // Reset form and refresh data
      setFormData({
        title: '',
        description: '',
        targetUrl: '',
        position: 'header',
        startDate: '',
        endDate: ''
      });
      setSelectedFile(null);
      setSelectedBanner(null);
      setShowAddModal(false);
      await fetchBanners();
      
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleBannerStatus = async (bannerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update banner status');
      }

      await fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      alert('Failed to update banner status');
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const editBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      targetUrl: banner.targetUrl || '',
      position: banner.position,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
    });
    setShowAddModal(true);
  };

  const filteredBanners = banners.filter(banner => {
    if (filter === 'active') return banner.isActive;
    if (filter === 'inactive') return !banner.isActive;
    return true;
  });

  const getPositionBadgeColor = (position: string) => {
    const colors = {
      header: 'bg-blue-100 text-blue-800',
      sidebar: 'bg-green-100 text-green-800',
      footer: 'bg-purple-100 text-purple-800',
      content: 'bg-orange-100 text-orange-800'
    };
    return colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading banners</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
            <Button onClick={fetchBanners} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col lg:flex-row space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Banner Management
          </h2>
          <p className="text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Manage reusable banners and advertisements
          </p>
        </div>
        <div className="flex gap-2 flex-col lg:flex-row w-full lg:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Banners</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <Button
            onClick={() => {
              setSelectedBanner(null);
              setFormData({
                title: '',
                description: '',
                targetUrl: '',
                position: 'header',
                startDate: '',
                endDate: ''
              });
              setSelectedFile(null);
              setShowAddModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Banner
          </Button>
        </div>
      </div>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.map((banner) => (
          <Card key={banner._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={getPositionBadgeColor(banner.position)}>
                  {banner.position}
                </Badge>
                <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Banner Image */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Banner Info */}
              <div>
                <h3 className="font-semibold text-gray-900 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {banner.title}
                </h3>
                {banner.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {banner.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Clicks:</span>
                  <span className="font-medium ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {banner.clickCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Views:</span>
                  <span className="font-medium ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {banner.impressionCount || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => editBanner(banner)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => toggleBannerStatus(banner._id, banner.isActive)}
                  variant={banner.isActive ? 'secondary' : 'default'}
                  size="sm"
                  className="flex-1"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {banner.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => deleteBanner(banner._id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBanners.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No banners found
            </h3>
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {filter === 'all' ? 'No banners have been created yet.' : `No ${filter} banners found.`}
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Create Your First Banner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {selectedBanner ? 'Edit Banner' : 'Add New Banner'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter banner title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter banner description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Banner Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required={!selectedBanner}
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as Banner['position'] })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="header">Header</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="content">Content Area</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    variant="outline"
                    className="flex-1"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {uploading ? <LoadingDots /> : (selectedBanner ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsManagement;