'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';

interface Farmer {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  farmName?: string;
  location?: string;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'pending';
  totalProducts: number;
  createdAt: string;
}

const FarmerManagement: React.FC = () => {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data for now
      setFarmers([
        {
          _id: '1',
          username: 'farmer_john',
          email: 'farmer@example.com',
          firstName: 'John',
          lastName: 'Smith',
          farmName: 'Green Valley Farm',
          location: 'California',
          isVerified: true,
          status: 'active',
          totalProducts: 15,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setError('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Farmer Management
        </h2>
        <Button className="bg-green-600 hover:bg-green-700">
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {farmers.map((farmer) => (
                  <tr key={farmer._id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{farmer.firstName} {farmer.lastName}</div>
                        <div className="text-sm text-gray-500">@{farmer.username}</div>
                      </div>
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
                        {farmer.isVerified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="destructive">
                          Suspend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerManagement;