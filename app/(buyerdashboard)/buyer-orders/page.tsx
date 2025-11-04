"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingDots from '@/components/ui/LoadingDots';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
  ShoppingBag
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
    hasReview?: boolean;
  }>;
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  estimatedDelivery?: string;
  actualDelivery?: string;
  sellerName: string;
  totalItems: number;
  canCancel: boolean;
  canTrack: boolean;
  hasReview?: boolean;
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
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
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const statusIcons = {
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
  
  // Track recently mutated orders to prevent auto-refresh overwrites
  const recentlyMutatedOrders = React.useRef<Set<string>>(new Set());
  
  // Cancel confirmation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Result dialog state
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: '' });
  
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

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortOrder, filters.status, filters.category, filters.dateRange, filters.customStartDate, filters.customEndDate]);

  // Auto-refresh orders every 30 seconds in the background (invisible loading)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false); // false = invisible loading
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only set up once

  // Debounced search effect
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm !== '') {
        setCurrentPage(1);
      }
    }, 500); // 500ms debounce

    setSearchDebounce(timeoutId);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Merge fresh data with recently mutated orders to prevent overwrites
        setOrders(prevOrders => {
          const freshOrders = data.data.orders;
          const recentlyMutated = recentlyMutatedOrders.current;
          
          if (recentlyMutated.size === 0) {
            // No recent mutations, use fresh data
            return freshOrders;
          }
          
          // Merge: keep local state for recently mutated orders
          return freshOrders.map(freshOrder => {
            if (recentlyMutated.has(freshOrder._id)) {
              // Find the local version
              const localOrder = prevOrders.find(o => o._id === freshOrder._id);
              if (localOrder) {
                // Keep local version if it has a pending cancellation request
                if (localOrder.cancellationRequest?.status === 'pending') {
                  return localOrder;
                }
              }
            }
            return freshOrder;
          });
        });
        
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

  const handleCancelOrder = async (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancelling(true);
      const response = await fetch(`/api/buyer/orders/${orderToCancel}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Close dialog first
        setShowCancelDialog(false);
        
        // Check if this is an immediate cancellation or a request pending approval
        if (data.requiresApproval) {
          // Mark this order as recently mutated
          recentlyMutatedOrders.current.add(orderToCancel);
          
          // Order requires seller approval - update local state to show pending cancellation
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === orderToCancel 
                ? { 
                    ...order, 
                    canCancel: false, // Remove cancel button (can't request twice)
                    cancellationRequest: {
                      requestedBy: 'buyer' as const,
                      reason: 'Buyer requested cancellation',
                      requestedAt: new Date().toISOString(),
                      status: 'pending' as const
                    }
                  }
                : order
            )
          );
          
          setOrderToCancel(null);
          
          // Clear the mutation flag after 60 seconds (2 auto-refresh cycles)
          setTimeout(() => {
            recentlyMutatedOrders.current.delete(orderToCancel);
          }, 60000);
          
          // Show success message
          setResultDialog({
            open: true,
            success: true,
            message: 'Cancellation request submitted. Waiting for seller approval.'
          });
        } else {
          // Order cancelled immediately (was pending)
          // Update local order status, payment status, and remove cancel/track buttons
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === orderToCancel 
                ? { 
                    ...order, 
                    status: 'cancelled' as const, 
                    paymentStatus: 'refunded' as const,
                    canCancel: false, 
                    canTrack: false 
                  }
                : order
            )
          );
          
          setOrderToCancel(null);
          
          // Show success message
          setResultDialog({
            open: true,
            success: true,
            message: data.message || 'Order cancelled successfully.'
          });
        }
      } else {
        setShowCancelDialog(false);
        setOrderToCancel(null);
        
        // Show error message
        setResultDialog({
          open: true,
          success: false,
          message: data.message || 'Failed to cancel order. Please try again.'
        });
      }
    } catch (error) {
      setShowCancelDialog(false);
      setOrderToCancel(null);
      
      // Show error message
      setResultDialog({
        open: true,
        success: false,
        message: 'Error cancelling order. Please check your connection and try again.'
      });
    } finally {
      setCancelling(false);
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
    <div className="w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My Orders
              </h1>
              <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Track and manage your orders
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Filters</span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Sort by:
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
            <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <option value="all">All Statuses</option>
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
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders Count and Results */}
        {pagination && (
          <div className="mb-3 sm:mb-4">
            <p className="text-sm sm:text-base text-gray-600 px-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} orders
              {filters.status !== 'all' || filters.category !== 'all' || filters.dateRange !== 'all' || filters.searchTerm ? ' (filtered)' : ''}
            </p>
          </div>
        )}

        {/* Orders Table or Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-12 text-center">
            <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 ? "You haven't placed any orders yet" : "No orders found"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 
                ? "Start shopping to see your orders here" 
                : "Try adjusting your filters to find what you're looking for"
              }
            </p>
            {pagination?.totalOrders === 0 ? (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Shopping
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
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
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {order.cancellationRequest?.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                              <Clock className="w-3 h-3" />
                              Cancel Pending
                            </span>
                          )}
                          {order.cancellationRequest?.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                              <XCircle className="w-3 h-3" />
                              Cancel Rejected
                            </span>
                          )}
                        </div>
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
                          {(order.status === 'delivered' || order.status === 'completed') && (
                            <Link
                              href={`/buyer-orders/${order._id}?tab=review`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Review
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
                <div key={order._id} className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <Link
                      href={`/buyer-orders/${order._id}`}
                      className="text-green-600 hover:text-green-700 font-semibold text-sm sm:text-base truncate touch-manipulation"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      #{order.orderNumber}
                    </Link>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                        {getStatusIcon(order.status)}
                        <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        <span className="sm:hidden">{order.status.charAt(0).toUpperCase() + order.status.slice(1, 4)}</span>
                      </span>
                      {order.cancellationRequest?.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Cancel Pending</span>
                          <span className="sm:hidden">Pending</span>
                        </span>
                      )}
                      {order.cancellationRequest?.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">Cancel Rejected</span>
                          <span className="sm:hidden">Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Date:</span> {formatDate(order.orderDate)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Products:</span> {getProductSummary(order.products)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="font-medium">Total:</span> {formatCurrency(order.finalAmount)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/buyer-orders/${order._id}`}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Link>
                    {order.canTrack && (
                      <Link
                        href={`/buyer-orders/${order._id}?tab=tracking`}
                        className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors touch-manipulation"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Track Order</span>
                        <span className="sm:hidden">Track</span>
                      </Link>
                    )}
                    {(order.status === 'delivered' || order.status === 'completed') && (
                      <Link
                        href={`/buyer-orders/${order._id}?tab=review`}
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                          order.hasReview 
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="hidden sm:inline">{order.hasReview ? 'View/Edit Review' : 'Write Review'}</span>
                        <span className="sm:hidden">{order.hasReview ? 'Review' : 'Review'}</span>
                      </Link>
                    )}
                    {order.canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Cancel Order</span>
                        <span className="sm:hidden">Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-3 sm:px-4 lg:px-6 py-4 bg-gray-50 border-t">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                  <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} orders
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const startPage = Math.max(1, pagination.currentPage - 2);
                        const page = startPage + i;
                        if (page > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg touch-manipulation ${
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
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => !cancelling && setShowCancelDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Cancel Order?
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setOrderToCancel(null);
                }}
                disabled={cancelling}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {resultDialog.success ? 'Success!' : 'Error'}
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              resultDialog.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {resultDialog.success ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {resultDialog.message}
            </p>
            
            {/* Button */}
            <button
              onClick={() => setResultDialog({ open: false, success: false, message: '' })}
              className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}