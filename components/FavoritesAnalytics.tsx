"use client";

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  TrendingUp, 
  Calendar, 
  Package, 
  Users, 
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface FavoritesStats {
  totalFavorites: number;
  favoritesThisMonth: number;
  favoritesSellersCount: number;
  topCategory: string;
  averagePriceRange: {
    min: number;
    max: number;
    average: number;
  };
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  priceRangeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface AnalyticsResponse {
  success: boolean;
  data: FavoritesStats;
  message?: string;
}

export default function FavoritesAnalytics() {
  const [stats, setStats] = useState<FavoritesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await fetch('/api/buyer/favorites/analytics', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites analytics');
      }

      const data: AnalyticsResponse = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchAnalytics(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Favorites Analytics
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-24"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Analytics Unavailable
          </h3>
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error || 'Unable to load favorites analytics'}
          </p>
          <button
            onClick={() => fetchAnalytics()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Favorites Analytics
          </h2>
        </div>
        <button
          onClick={refreshAnalytics}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Total Favorites
              </p>
              <p className="text-2xl font-bold text-red-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.totalFavorites}
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                This Month
              </p>
              <p className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.favoritesThisMonth}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Sellers
              </p>
              <p className="text-2xl font-bold text-blue-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.favoritesSellersCount}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Top Category
              </p>
              <p className="text-lg font-bold text-purple-700 capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.topCategory.replace('-', ' ')}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Price Range Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Price Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Minimum</p>
            <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(stats.averagePriceRange.min)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Average</p>
            <p className="text-xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(stats.averagePriceRange.average)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Maximum</p>
            <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(stats.averagePriceRange.max)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Favorites by Category
          </h3>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-gray-700 capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {category.category.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {category.count}
                  </span>
                  <span className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    ({category.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range Distribution */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Price Range Distribution
          </h3>
          <div className="space-y-3">
            {stats.priceRangeDistribution.map((range, index) => (
              <div key={range.range} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${120 + (index * 60)}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {range.range}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {range.count}
                  </span>
                  <span className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    ({range.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Favorites Added Over Time
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-32 gap-2">
              {stats.monthlyTrend.map((month, index) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600"
                    style={{ 
                      height: `${(month.count / Math.max(...stats.monthlyTrend.map(m => m.count))) * 100}%`,
                      minHeight: month.count > 0 ? '8px' : '2px'
                    }}
                    title={`${month.month}: ${month.count} favorites`}
                  ></div>
                  <span className="text-xs text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {month.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}