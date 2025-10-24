"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Copy,
  Download,
  MessageSquare,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface OrderDetails {
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
    subtotal: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    fullAddress: string;
  };
  sellerId: string;
  sellerName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  canCancel: boolean;
  canTrack: boolean;
  canContactSeller: boolean;
  isActive: boolean;
  trackingSteps: TrackingStep[];
  summary: {
    itemCount: number;
    totalQuantity: number;
    avgItemPrice: number;
    hasDeliveryFee: boolean;
    savings: number;
  };
}

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    order: OrderDetails;
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

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const activeTab = searchParams.get('tab') || 'details';

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await fetch(`/api/buyer/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view order details');
        } else if (response.status === 404) {
          throw new Error('Order not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this order');
        } else {
          throw new Error('Failed to fetch order details');
        }
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setOrder(data.data.order);
      } else {
        throw new Error(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
      setOrder(null);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshOrderDetails = async () => {
    setRefreshing(true);
    await fetchOrderDetails(false);
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      const response = await fetch(`/api/buyer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchOrderDetails(false); // Refresh order details
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to cancel order');
      }
    } catch (error) {
      alert('Error cancelling order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const copyOrderNumber = async () => {
    if (order) {
      try {
        await navigator.clipboard.writeText(order.orderNumber);
        // Could add toast notification here
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = order.orderNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {error || 'Order not found'}
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/buyer-orders"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Orders
              </Link>
              {error && (
                <button
                  onClick={() => fetchOrderDetails()}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/buyer-orders"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Order #{order.orderNumber}
                </h1>
                <button
                  onClick={copyOrderNumber}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy Order Number"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={refreshOrderDetails}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Refresh Order Details"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Placed on {formatDate(order.orderDate)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                <Package className="w-4 h-4" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${paymentStatusColors[order.paymentStatus]}`}>
                <CreditCard className="w-4 h-4" />
                Payment {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <Link
                href={`/buyer-orders/${orderId}`}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Order Details
              </Link>
              <Link
                href={`/buyer-orders/${orderId}?tab=tracking`}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracking'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Order Tracking
              </Link>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Products */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Items ({order.summary.itemCount} products, {order.summary.totalQuantity} items)
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {order.products.map((product, index) => (
                    <div key={index} className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {product.productName}
                        </h3>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Category: {product.category}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Quantity: {product.quantity} {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          per {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {formatCurrency(product.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <MapPin className="w-5 h-5" />
                  Delivery Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Delivery Address
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.deliveryAddress.fullAddress}
                    </p>
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Estimated Delivery
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatDate(order.estimatedDelivery)}
                      </p>
                    </div>
                  )}
                  
                  {order.actualDelivery && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Actual Delivery
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatDate(order.actualDelivery)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Notes
                  </h2>
                  <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Subtotal</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Delivery Fee</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {formatCurrency(order.deliveryFee)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Total</span>
                      <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 pt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Average price per item: {formatCurrency(order.summary.avgItemPrice)}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Method</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Status</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${paymentStatusColors[order.paymentStatus]}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Seller Name</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.sellerName}
                    </span>
                  </div>
                  {order.canContactSeller && (
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span style={{ fontFamily: 'Poppins, sans-serif' }}>Contact Seller</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <Download className="w-4 h-4" />
                    <span style={{ fontFamily: 'Poppins, sans-serif' }}>Download Invoice</span>
                  </button>
                  
                  {order.canCancel && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tracking Tab */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Order Tracking
              </h2>
              
              <div className="relative">
                {order.trackingSteps.map((step, index) => (
                  <div key={step.status} className="relative flex items-start pb-8 last:pb-0">
                    {/* Timeline Line */}
                    {index < order.trackingSteps.length - 1 && (
                      <div className={`absolute left-4 top-8 w-0.5 h-full ${
                        step.completed ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                    )}
                    
                    {/* Status Icon */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? step.status === 'cancelled' 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      {step.completed ? (
                        step.status === 'cancelled' ? (
                          <XCircle className="w-5 h-5 text-white" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )
                      ) : (
                        <Clock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {step.title}
                        </h3>
                        {step.timestamp && (
                          <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {formatDate(step.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        step.completed ? 'text-gray-600' : 'text-gray-400'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {order.status === 'cancelled' && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Order Cancelled
                      </h4>
                      <p className="text-sm text-red-700 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        This order has been cancelled. If you have any questions, please contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {order.estimatedDelivery && !['delivered', 'completed', 'cancelled'].includes(order.status) && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Estimated Delivery
                      </h4>
                      <p className="text-sm text-blue-700 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Your order is expected to arrive by {formatDate(order.estimatedDelivery)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}