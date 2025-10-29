'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';

interface ReportData {
  totalUsers: number;
  totalFarmers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  period: string;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data for now
      setReportData({
        totalUsers: 1250,
        totalFarmers: 350,
        totalProducts: 2800,
        totalOrders: 5600,
        revenue: 125000,
        period: selectedPeriod
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data');
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
          Reports & Analytics
        </h2>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button className="bg-green-600 hover:bg-green-700">
            Export Report
          </Button>
        </div>
      </div>

      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-green-600">+12% from last period</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalFarmers.toLocaleString()}</div>
              <div className="text-xs text-green-600">+8% from last period</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalProducts.toLocaleString()}</div>
              <div className="text-xs text-green-600">+15% from last period</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${reportData.revenue.toLocaleString()}</div>
              <div className="text-xs text-green-600">+22% from last period</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart placeholder - User growth over time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart placeholder - Revenue trends
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;