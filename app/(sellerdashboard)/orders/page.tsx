"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingDots from '@/components/ui/LoadingDots';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { 
  Package, 
  Search, 
  ChevronDown, 
  Eye, 
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  PackageCheck,
  FileText,
  Mail,
  Phone,
  MapPin
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
  buyerName: string;
  buyerEmail: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  totalItems: number;
  canConfirm: boolean;
  canPrepare: boolean;
  canShip: boolean;
  canComplete: boolean;
  canCancel: boolean;
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
  completed: PackageCheck
};

const statusActions: { [key: string]: { label: string; nextStatus: string; color: string; icon: any }[] } = {
  // Legacy statuses (for old orders in database)
  pending: [
    { label: 'Start Preparing', nextStatus: 'preparing', color: 'bg-[#4A7C59] hover:bg-[#3d6549]', icon: Package },
    { label: 'Cancel', nextStatus: 'cancelled', color: 'bg-red-600 hover:bg-red-700', icon: XCircle }
  ],
  confirmed: [
    { label: 'Start Preparing', nextStatus: 'preparing', color: 'bg-[#4A7C59] hover:bg-[#3d6549]', icon: Package },
    { label: 'Cancel', nextStatus: 'cancelled', color: 'bg-red-600 hover:bg-red-700', icon: XCircle }
  ],
  // Current workflow
  preparing: [
    { label: 'Mark as Shipped', nextStatus: 'shipped', color: 'bg-[#4A7C59] hover:bg-[#3d6549]', icon: Truck },
    { label: 'Cancel', nextStatus: 'cancelled', color: 'bg-red-600 hover:bg-red-700', icon: XCircle }
  ],
  shipped: [
    // Seller cannot mark as delivered - only buyer can confirm receipt
    { label: 'Cancel', nextStatus: 'cancelled', color: 'bg-red-600 hover:bg-red-700', icon: XCircle }
  ],
  delivered: [
    // Seller can complete order after buyer confirms delivery
    { label: 'Complete Order', nextStatus: 'completed', color: 'bg-emerald-600 hover:bg-emerald-700', icon: PackageCheck }
  ],
  cancelled: [],
  completed: []
};

const ManageOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: string; message: string } | null>(null);
  
  // Result dialog state
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: '' });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: ''
  });
  const [sortBy, setSortBy] = useState<'orderDate' | 'status' | 'finalAmount'>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortBy, sortOrder, filters.status, filters.dateRange, filters.customStartDate, filters.customEndDate]);

  // Auto-refresh orders every 30 seconds in the background (invisible loading)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false); // false = invisible loading
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentPage, sortBy, sortOrder, filters]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm]);

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.searchTerm.trim()) queryParams.set('search', filters.searchTerm.trim());

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

      const response = await fetch(`/api/seller/orders?${queryParams.toString()}`, {
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

      const data = await response.json();

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
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const confirmMessages: { [key: string]: string } = {
      confirmed: 'Confirm this order?',
      preparing: 'Start preparing this order?',
      shipped: 'Mark this order as shipped?',
      delivered: 'Mark this order as delivered?',
      completed: 'Complete this order?',
      cancelled: 'Cancel this order? This action cannot be undone.'
    };

    // Show custom confirmation dialog
    setConfirmAction({
      orderId,
      status: newStatus,
      message: confirmMessages[newStatus] || 'Update order status?'
    });
    setShowConfirmDialog(true);
  };

  const confirmUpdateStatus = async () => {
    if (!confirmAction) return;

    const { orderId, status: newStatus } = confirmAction;

    try {
      setUpdatingOrderId(orderId);
      setShowConfirmDialog(false);

      const response = await fetch(`/api/seller/orders/${orderId}/update-status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchOrders(false);
        
        // Check if there were deleted products
        let successMessage = newStatus === 'confirmed' 
          ? 'Order confirmed successfully! Email notification sent to buyer.' 
          : `Order status updated to ${newStatus} successfully.`;
        
        // Add warning if products were removed
        if (data.warning && data.deletedProducts) {
          successMessage += `\n\n⚠️ ${data.warning}\n\nRemoved items:\n${
            data.deletedProducts.map((p: any) => 
              `• ${p.productName} (${p.quantity} pcs × ₱${p.price})`
            ).join('\n')
          }`;
        }
        
        setResultDialog({
          open: true,
          success: true,
          message: successMessage
        });
      } else {
        await fetchOrders(false);
        
        // Format error message from API response
        let errorMessage = data.message || 'Failed to update order status';
        
        // If there are detailed error items, format them
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          errorMessage = data.message + '\n\n' + data.details.map((item: any) => {
            if (typeof item === 'object' && item.reason) {
              return `• ${item.reason}`;
            }
            return `• ${String(item)}`;
          }).join('\n');
        }
        
        // If there are product details, add them
        if (data.productDetails && Array.isArray(data.productDetails) && data.productDetails.length > 0) {
          const productInfo = data.productDetails.map((detail: any) => {
            if (detail.product) {
              const reserved = detail.product.reserved ?? 'N/A';
              const available = detail.product.available ?? 'N/A';
              const committed = detail.product.committed ?? 'N/A';
              return `• ${detail.product.name}: Reserved: ${reserved}, Available: ${available}, Committed: ${committed}`;
            }
            return '';
          }).filter(Boolean).join('\n');
          
          if (productInfo) {
            errorMessage += '\n\nInventory Status:\n' + productInfo;
          }
        }
        
        setResultDialog({
          open: true,
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      await fetchOrders(false);
      setResultDialog({
        open: true,
        success: false,
        message: 'Error updating order status. Please try again.'
      });
    } finally {
      setUpdatingOrderId(null);
      setConfirmAction(null);
    }
  };

  const handleCancellationRequest = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(`/api/seller/orders/${orderId}/handle-cancellation`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchOrders(false);
        
        setResultDialog({
          open: true,
          success: true,
          message: action === 'approve' 
            ? 'Cancellation approved. The order has been cancelled and inventory has been released.' 
            : 'Cancellation request rejected. The order will continue as planned.'
        });
      } else {
        await fetchOrders(false);
        
        setResultDialog({
          open: true,
          success: false,
          message: data.message || `Failed to ${action} cancellation request`
        });
      }
    } catch (error) {
      await fetchOrders(false);
      setResultDialog({
        open: true,
        success: false,
        message: 'Error processing cancellation request. Please try again.'
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#103C2E" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading orders
          </h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Please wait...
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
              className="bg-[#4A7C59] hover:bg-[#3d6549] text-white px-6 py-2 rounded-lg transition-colors"
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
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#103C2E] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Manage Orders
            </h1>
            <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              View and update your customer orders
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number, buyer, or product..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending (Legacy)</option>
                    <option value="confirmed">Confirmed (Legacy)</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
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
                    onClick={() => {
                      setFilters({
                        status: 'all',
                        searchTerm: '',
                        dateRange: 'all',
                        customStartDate: '',
                        customEndDate: ''
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
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
                      onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders Count */}
        {pagination && (
          <div className="mb-4">
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} orders
            </p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-12 text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 ? "No orders yet" : "No orders found"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalOrders === 0 
                ? "Orders from customers will appear here" 
                : "Try adjusting your filters"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#103C2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <Link
                        href={`/orders/${order._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#103C2E] hover:bg-[#0d2e23] text-white rounded-lg text-xs font-medium transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Eye className="w-3 h-3" />
                        Track
                      </Link>
                      {order.cancellationRequest?.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-300 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Cancellation Requested
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{formatDate(order.orderDate)}</span>
                      </span>
                      <span className="flex items-center gap-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{order.buyerName}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#103C2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {formatCurrency(order.finalAmount)}
                    </div>
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="border-t pt-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Products */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Products
                      </h4>
                      <div className="space-y-1">
                        {order.products.map((product, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <span>{product.productName} ({product.quantity} {product.unit})</span>
                            <span className="font-medium">{formatCurrency(product.price * product.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <MapPin className="w-4 h-4" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <p>{order.buyerName}</p>
                        <p>{order.deliveryAddress.street}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.province}</p>
                        <p>{order.deliveryAddress.zipCode}</p>
                        <p className="flex items-center gap-1 text-gray-500 mt-2">
                          <Mail className="w-3 h-3" />
                          {order.buyerEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancellation Request Notice */}
                {order.cancellationRequest?.status === 'pending' && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          The buyer has requested to cancel this order
                        </p>
                        {order.cancellationRequest.reason && (
                          <div className="bg-white border border-red-200 rounded p-3 my-2">
                            <p className="text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Reason:
                            </p>
                            <p className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {order.cancellationRequest.reason}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleCancellationRequest(order._id, 'approve')}
                            disabled={updatingOrderId === order._id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {updatingOrderId === order._id ? (
                              <>
                                <LoadingDots size="sm" color="#ffffff" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Approve Cancellation
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCancellationRequest(order._id, 'reject')}
                            disabled={updatingOrderId === order._id}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {updatingOrderId === order._id ? (
                              <>
                                <LoadingDots size="sm" color="#ffffff" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Reject Request
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipped Order Notice */}
                {order.status === 'shipped' && (
                  <div className={`${order.cancellationRequest?.status === 'pending' ? '' : 'border-t'} pt-4`}>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Waiting for buyer confirmation
                        </p>
                        <p className="text-sm text-blue-700 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          The buyer needs to confirm receipt before you can complete this order.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {statusActions[order.status] && statusActions[order.status].length > 0 && (
                  <div className={`${order.status === 'shipped' ? '' : 'border-t'} pt-4`}>
                    <div className="flex flex-wrap gap-2">
                      {statusActions[order.status].map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.nextStatus}
                            onClick={() => handleUpdateStatus(order._id, action.nextStatus)}
                            disabled={updatingOrderId === order._id}
                            className={`flex items-center gap-2 px-4 py-2 ${action.color} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {updatingOrderId === order._id ? (
                              <>
                                <LoadingDots size="sm" color="#ffffff" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Icon className="w-4 h-4" />
                                <span>{action.label}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow-sm px-4 sm:px-6 py-4 gap-3">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        pagination.currentPage === page
                          ? 'bg-[#4A7C59] text-white'
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
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px] font-poppins">
          <VisuallyHidden>
            <DialogTitle>Confirm Action</DialogTitle>
          </VisuallyHidden>
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {/* Icon */}
            <div className="mb-4 relative">
              <div className="bg-blue-100 rounded-full p-4">
                <AlertCircle className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              {confirmAction?.status === 'cancelled' ? 'Cancel Order' : 'Confirm Action'}
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              {confirmAction?.message}
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateStatus}
                className={`flex-1 ${
                  confirmAction?.status === 'cancelled' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-[#4A7C59] hover:bg-[#3d6849]'
                } text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200`}
              >
                OK
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      {resultDialog.open && (
        <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
            <VisuallyHidden>
              <DialogTitle>{resultDialog.success ? 'Success' : 'Error'}</DialogTitle>
            </VisuallyHidden>
            <div className="flex flex-col items-center gap-4">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                resultDialog.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {resultDialog.success ? (
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                {resultDialog.success ? 'Success!' : 'Error'}
              </h3>
              
              {/* Message */}
              <div className="text-gray-700 text-sm max-h-96 overflow-y-auto w-full">
                <pre className="whitespace-pre-wrap font-sans text-left px-4">
                  {resultDialog.message}
                </pre>
              </div>
              
              {/* Button */}
              <button
                onClick={() => setResultDialog({ open: false, success: false, message: '' })}
                className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManageOrders;

