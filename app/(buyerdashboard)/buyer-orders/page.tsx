"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingDots from '@/components/ui/LoadingDots';
import { 
  Package, 
  Search, 
  Calendar, 
  ChevronDown, 
  Eye, 
  X, 
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

// Custom Filter Icon
const Filter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 6l8 0" />
    <path d="M16 6l4 0" />
    <path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 12l2 0" />
    <path d="M10 12l10 0" />
    <path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 18l11 0" />
    <path d="M19 18l1 0" />
  </svg>
);

interface Order {
  _id: string;
  orderNumber: string;
  orderDate: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
    category: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  estimatedDelivery?: string;
  actualDelivery?: string;
  sellerName: string;
  totalItems: number;
  canCancel: boolean;
  canTrack: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface Filters {
  status: string;
  category: string;
  dateRange: string;
  searchTerm: string;
  customStartDate: string;
  customEndDate: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: Pagination;
    filters: any;
    meta: any;
  };
  message?: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filters and sorting
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    category: 'all',
    dateRange: 'all',
    searchTerm: '',
    customStartDate: '',
    customEndDate: ''
  });
  const [sortBy, setSortBy] = useState<'orderDate' | 'status' | 'finalAmount'>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search to avoid excessive API calls
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortBy, sortOrder, filters.status, filters.category, filters.dateRange, filters.customStartDate, filters.customEndDate]);

  // Debounced search effect
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm !== '' || currentPage !== 1) {
        setCurrentPage(1);
        fetchOrders();
      }
    }, 500); // 500ms debounce

    setSearchDebounce(timeoutId);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [filters.searchTerm]);

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      // Add filters to query
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.category !== 'all') queryParams.set('category', filters.category);
      if (filters.searchTerm.trim()) queryParams.set('search', filters.searchTerm.trim());

      // Add date range filters
      if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
        queryParams.set('startDate', filters.customStartDate);
        queryParams.set('endDate', filters.customEndDate);
      } else if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();

        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }

        if (filters.dateRange !== 'all') {
          queryParams.set('startDate', startDate.toISOString().split('T')[0]);
        }
      }

      const response = await fetch(`/api/buyer/orders?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your orders');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view orders');
        } else {
          throw new Error('Failed to fetch orders');
        }
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
      setPagination(null);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      dateRange: 'all',
      searchTerm: '',
      customStartDate: '',
      customEndDate: ''
    });
    setCurrentPage(1);
  };

  const refreshOrders = async () => {
    setRefreshing(true);
    await fetchOrders(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/buyer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Refresh orders to get updated data
        await fetchOrders(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to cancel order');
      }
    } catch (error) {
      alert('Error cancelling order. Please try again.');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getProductSummary = (products: Order['products']) => {
    if (products.length === 1) {
      return products[0].productName;
    }
    return `${products[0].productName} ${products.length > 1 ? `+${products.length - 1} more` : ''}`;
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
            Loading your orders
          </h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Error Loading Orders
            </h2>
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My Orders
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Track and manage your orders
              </p>
            </div>
            <button
              onClick={refreshOrders}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number, product, or seller..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Filter className="w-5 h-5" />
                Filters
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="orderDate-desc">Newest First</option>
                <option value="orderDate-asc">Oldest First</option>
                <option value="finalAmount-desc">Highest Amount</option>
                <option value="finalAmount-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Product Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="leafy-greens">Leafy Greens</option>
                    <option value="root-crops">Root Crops</option>
                    <option value="fruits">Fruits</option>
                    <option value="spices-aromatics">Spices & Aromatics</option>
                    <option value="eggplant-gourds">Eggplant & Gourds</option>
                    <option value="grains-rice">Grains & Rice</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders Count and Results */}
        {pagination && (
          <div className="mb-4">
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} orders
              {filters.status !== 'all' || filters.category !== 'all' || filters.dateRange !== 'all' || filters.searchTerm ? ' (filtered)' : ''}
            </p>
          </div>
        )}

        {/* Orders Table or Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 ? "You haven't placed any orders yet" : "No orders found"}
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 
                ? "Start shopping to see your orders here" 
                : "Try adjusting your filters to find what you're looking for"
              }
            </p>
            {pagination?.totalOrders === 0 ? (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/buyer-orders/${order._id}`}
                          className="text-green-600 hover:text-green-700 font-medium"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {getProductSummary(order.products)}
                        </div>
                        <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {order.products.reduce((sum, p) => sum + p.quantity, 0)} items
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/buyer-orders/${order._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                          {order.canTrack && (
                            <Link
                              href={`/buyer-orders/${order._id}?tab=tracking`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              <Truck className="w-3 h-3" />
                              Track
                            </Link>
                          )}
                          {order.canCancel && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {orders.map((order) => (
                <div key={order._id} className="p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start mb-3">
                    <Link
                      href={`/buyer-orders/${order._id}`}
                      className="text-green-600 hover:text-green-700 font-semibold"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Date:</span> {formatDate(order.orderDate)}
                    </div>
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Products:</span> {getProductSummary(order.products)}
                    </div>
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Total:</span> {formatCurrency(order.finalAmount)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/buyer-orders/${order._id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {order.canTrack && (
                      <Link
                        href={`/buyer-orders/${order._id}?tab=tracking`}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Truck className="w-4 h-4" />
                        Track Order
                      </Link>
                    )}
                    {order.canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <X className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} orders
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            pagination.currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}