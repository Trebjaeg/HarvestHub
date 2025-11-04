import { useState, useEffect, useCallback } from 'react';

export interface SellerStats {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
  };
  orderStats: {
    pending: number;
    preparing: number;
    shipped: number;
    delivered: number;
    completed: number;
  };
  recentActivity: {
    recentOrders: number;
    recentRevenue: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
  topProducts: {
    _id: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }[];
  monthlyRevenue: {
    _id: { year: number; month: number };
    revenue: number;
    orderCount: number;
  }[];
}

export interface DetailedAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
  dailyStats: {
    _id: { year: number; month: number; day: number };
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
  }[];
  productPerformance: {
    _id: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
    avgPrice: number;
    orderCount: number;
  }[];
  customerAnalytics: {
    _id: string;
    buyerName: string;
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: string;
  }[];
  conversionFunnel: {
    _id: string;
    count: number;
  }[];
  geoDistribution: {
    _id: string;
    orderCount: number;
    revenue: number;
  }[];
  paymentMethods: {
    _id: string;
    count: number;
    revenue: number;
  }[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export function useSellerStats() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // Get token from localStorage for Authorization header
      const token = typeof window !== 'undefined' ? localStorage.getItem('hh_token') : null;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/seller/stats', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch seller statistics: ${errorData}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats(false);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
    refetch: fetchStats
  };
}

export function useSellerAnalytics(period = 30, status = 'all') {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period: period.toString(),
        status
      });

      const response = await fetch(`/api/seller/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();

      if (data.success) {
        setAnalytics(data);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period, status]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh,
    refetch: fetchAnalytics
  };
}

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  // Ensure peso symbol (₱) is displayed correctly
  if (amount === 0) return '₱0.00';
  
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback if Intl.NumberFormat fails
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const getMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1];
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};