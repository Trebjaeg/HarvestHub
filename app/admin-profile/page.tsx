'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingDots from '@/components/ui/LoadingDots';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  sellerStatus?: string;
  status: string;
  profileImage?: string;
}

const AdminProfilePage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'seller':
        return 'bg-green-500 text-white';
      case 'buyer':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <LoadingDots size="lg" color="#16a34a" />
            </div>
            <p className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Loading profile...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {error || 'Failed to load profile'}
              </p>
              <Button onClick={() => router.push('/admin')} className="bg-green-600 hover:bg-green-700">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My Profile
              </h1>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-600 hover:text-green-600"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 11l-4 4l4 4m-4 -4h11a4 4 0 0 0 0 -8h-1" />
                </svg>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center space-x-4">
                {/* Profile Avatar */}
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {profile.name}
                  </CardTitle>
                  <Badge className={getRoleBadgeColor(profile.role)}>
                    {profile.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Account Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Email
                      </span>
                      <span className="text-gray-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {profile.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        User ID
                      </span>
                      <span className="text-gray-800 font-mono text-sm">
                        {profile.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Role
                      </span>
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {profile.role.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Account Status
                      </span>
                      <Badge className={profile.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {profile.status.toUpperCase()}
                      </Badge>
                    </div>

                    {profile.sellerStatus && (
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Seller Status
                        </span>
                        <Badge className={
                          profile.sellerStatus === 'verified' ? 'bg-green-500 text-white' :
                          profile.sellerStatus === 'pending' ? 'bg-yellow-500 text-white' :
                          profile.sellerStatus === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }>
                          {profile.sellerStatus.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Privileges */}
                {(profile.role === 'admin' || profile.role === 'superadmin') && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Administrative Privileges
                    </h3>
                    <p className="text-blue-600 text-sm mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      You have access to the following administrative features:
                    </p>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        User Management
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Farmer Verification
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Reports Management
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Audit Logs
                      </li>
                      {profile.role === 'superadmin' && (
                        <li className="flex items-center text-purple-700 font-semibold">
                          <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Full System Access (Superadmin)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminProfilePage;
