'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import EditAdminProfileModal from '@/components/ui/EditAdminProfileModal';
import { ArrowLeft, Edit, Camera, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

interface AdminProfile {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  sellerStatus?: string;
  phone?: string;
  profileImage?: string;
}

interface AdminStats {
  totalActions: number;
  auditLogs: number;
  verifiedFarmers: number;
  resolvedReports: number;
}

const AdminProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      } else {
        console.error('Failed to fetch admin profile');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/admin/upload-profile-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (profile) {
          setProfile({ ...profile, profileImage: data.imageUrl });
        }
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

  const handleProfileUpdate = (updatedProfile: AdminProfile) => {
    setProfile(updatedProfile);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <svg viewBox="0 0 120 30" className="w-12 h-8" role="img" aria-label="loading" xmlns="http://www.w3.org/2000/svg">
              <circle cx={30} cy={15} r={8} fill="#103C2E">
                <animate attributeName="cy" dur="0.8s" begin="0s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
                <animate attributeName="opacity" dur="0.8s" begin="0s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
              </circle>
              <circle cx={60} cy={15} r={8} fill="#103C2E">
                <animate attributeName="cy" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
                <animate attributeName="opacity" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
              </circle>
              <circle cx={90} cy={15} r={8} fill="#103C2E">
                <animate attributeName="cy" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
                <animate attributeName="opacity" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
              </circle>
            </svg>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Unable to load profile</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-8 px-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {/* Back Button */}
        <Button
          onClick={() => router.push('/admin')}
          variant="ghost"
          className="mb-6 text-gray-700 hover:text-[#103C2E] hover:bg-[#F5F5DC]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#103C2E]">
              Admin Profile
            </h1>
          </div>
          <Button 
            className="bg-[#103C2E] hover:bg-[#0d2e23] text-white w-full sm:w-auto" 
            onClick={() => setIsEditModalOpen(true)}
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
                {profile.profileImage ? (
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
                {profile.firstName && profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.name}
              </h2>
              <p className="text-gray-600">
                {profile.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold text-[#103C2E]">
                    {stats.totalActions}
                  </p>
                </div>
                <svg className="w-8 h-8 text-[#103C2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audit Logs</p>
                  <p className="text-2xl font-bold text-[#103C2E]">
                    {stats.auditLogs}
                  </p>
                </div>
                <svg className="w-8 h-8 text-[#103C2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Farmers</p>
                  <p className="text-2xl font-bold text-[#103C2E]">
                    {stats.verifiedFarmers}
                  </p>
                </div>
                <svg className="w-8 h-8 text-[#103C2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved Reports</p>
                  <p className="text-2xl font-bold text-[#103C2E]">
                    {stats.resolvedReports}
                  </p>
                </div>
                <svg className="w-8 h-8 text-[#103C2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditAdminProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />
    </ProtectedRoute>
  );
};

export default AdminProfilePage;
