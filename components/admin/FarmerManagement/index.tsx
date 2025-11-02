'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';

interface Farmer {
  _id: string;
  username?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  farmName?: string;
  location?: string;
  role: string;
  status: 'active' | 'suspended' | 'deleted';
  totalProducts?: number;
  createdAt: string;
  farmerVerification?: {
    status?: 'approved' | 'pending' | 'rejected';
  };
}

const FarmerManagement: React.FC = () => {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending' | 'rejected' | 'not-applied'>('all');

  useEffect(() => {
    fetchFarmers();
  }, []);

  // Auto-refresh when filter changes
  useEffect(() => {
    fetchFarmers();
  }, [verificationFilter]);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the REAL API endpoint
      const response = await fetch('/api/admin/farmers', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch farmers');
      }

      const data = await response.json();
      setFarmers(data.farmers || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setError('Failed to load farmers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFarmerStatus = async (farmerId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'deleted' : 'active';
      const response = await fetch(`/api/admin/farmers/${farmerId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update farmer status');
      }

      fetchFarmers(); // Refresh the list
    } catch (error) {
      console.error('Error updating farmer status:', error);
    }
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Not Applied</span>;
    }
  };

  // Helper function to get display name
  const getDisplayName = (farmer: Farmer) => {
    if (farmer.firstName && farmer.lastName) {
      return `${farmer.firstName} ${farmer.lastName}`;
    }
    return farmer.name || farmer.username || 'N/A';
  };

  // Filter farmers based on search and verification status
  const filteredFarmers = farmers.filter(farmer => {
    // Search filter
    const displayName = getDisplayName(farmer);
    const matchesSearch = searchTerm === '' || 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (farmer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    // Verification filter
    const verificationStatus = farmer.farmerVerification?.status;
    let matchesVerification = true;
    
    if (verificationFilter === 'verified') {
      matchesVerification = verificationStatus === 'approved';
    } else if (verificationFilter === 'pending') {
      matchesVerification = verificationStatus === 'pending';
    } else if (verificationFilter === 'rejected') {
      matchesVerification = verificationStatus === 'rejected';
    } else if (verificationFilter === 'not-applied') {
      matchesVerification = !verificationStatus;
    }

    return matchesSearch && matchesVerification;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingDots size="lg" color="#16a34a" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Farmer Management
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <option value="all">All Farmers</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="not-applied">Not Applied</option>
          </select>
          <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            Export Data
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Farmer</th>
                  <th className="text-left p-2">Farm</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Products</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {getDisplayName(farmer)}
                      </div>
                      <div className="text-sm text-gray-500">{farmer.email}</div>
                      {farmer.username && (
                        <div className="text-sm text-gray-500">@{farmer.username}</div>
                      )}
                    </td>
                    <td className="p-2">{farmer.farmName || 'N/A'}</td>
                    <td className="p-2">{farmer.location || 'N/A'}</td>
                    <td className="p-2">{farmer.totalProducts}</td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <Badge variant={
                          farmer.status === 'active' ? 'default' :
                          farmer.status === 'suspended' ? 'destructive' : 'secondary'
                        }>
                          {farmer.status}
                        </Badge>
                        {getVerificationStatusBadge(farmer.farmerVerification?.status)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant={farmer.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => toggleFarmerStatus(farmer._id, farmer.status)}
                        >
                          {farmer.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredFarmers.map((farmer) => (
              <Card key={farmer._id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {getDisplayName(farmer)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{farmer.email}</p>
                        {farmer.username && (
                          <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>@{farmer.username}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        farmer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : farmer.status === 'suspended'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {farmer.status === 'active' ? 'Active' : farmer.status === 'suspended' ? 'Suspended' : 'Deactivated'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {getVerificationStatusBadge(farmer.farmerVerification?.status)}
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Joined: {new Date(farmer.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View
                      </Button>
                      <Button
                        onClick={() => toggleFarmerStatus(farmer._id, farmer.status)}
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${farmer.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        {farmer.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredFarmers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>No farmers found</h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {searchTerm || verificationFilter !== 'all' 
                  ? 'No farmers match your search criteria. Try adjusting your filters.' 
                  : 'There are no farmers in the system yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerManagement;