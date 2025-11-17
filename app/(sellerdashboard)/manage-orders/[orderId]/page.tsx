"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LalamoveTracker from '@/components/LalamoveTracker';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  User, 
  Mail, 
  AlertCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed' | 'pending' | 'confirmed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
    category?: string;
    subtotal?: number;
    image?: string;
  }[];
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    barangay?: string;
    fullAddress?: string;
  };
  paymentMethod: string;
  orderDate: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  buyerName: string;
  buyerEmail: string;
  lalamove_order_id?: string;
  lalamove_quotation_id?: string;
  lalamove_share_link?: string;
  refusalReason?: string;
  refusalDate?: string;
  refusalProof?: {
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  trackingSteps?: TrackingStep[];
  createdAt?: string;
  updatedAt?: string;
  totalItems?: number;
  notes?: string;
}

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
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

export default function SellerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const activeTab = (searchParams?.get('tab') || 'details') as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrderDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(`/api/seller/orders/${orderId}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setError('');
      } else {
        if (showLoader) {
          setError('Order not found');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (showLoader) {
        setError('Failed to load order details');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      router.push('/manage-orders');
      return;
    }

    fetchOrderDetails();
  }, [orderId, router, fetchOrderDetails]);

  // Auto-refresh order details every 15 seconds (invisible background update)
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(() => {
      fetchOrderDetails(false); // false = invisible loading
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [orderId, fetchOrderDetails]);

  const getTrackingSteps = (status: string): TrackingStep[] => {
    const allSteps = [
      { status: 'pending', title: 'Order Received', description: 'Order has been placed and is pending confirmation', completed: false },
      { status: 'confirmed', title: 'Order Confirmed', description: 'Order has been confirmed by seller', completed: false },
      { status: 'preparing', title: 'Preparing Order', description: 'Your order is being prepared for shipment', completed: false },
      { status: 'shipped', title: 'Order Shipped', description: 'Your order is on its way', completed: false },
      { status: 'delivered', title: 'Order Delivered', description: 'Order has been successfully delivered', completed: false }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      timestamp: index === currentIndex ? new Date().toISOString() : undefined
    }));
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrderDetails(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103C2E] mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <Link href="/manage-orders" className="mt-4 inline-block text-[#103C2E] hover:underline" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/manage-orders"
            className="inline-flex items-center gap-2 text-[#103C2E] hover:text-[#0d2e23] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#103C2E] mb-2">
                Order #{order.orderNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${statusColors[order.status as keyof typeof statusColors]} border`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                {order.cancellationRequest?.status === 'pending' && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Cancellation Requested
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#103C2E]">
                ₱{order.finalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {order.products.length} {order.products.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Method</p>
              <p className="font-medium uppercase">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Status</p>
              <p className="font-medium capitalize">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-gray-600">Estimated Delivery</p>
              <p className="font-medium">
                {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Cancellation Request Notice */}
        {order.cancellationRequest?.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Cancellation Request Pending
                </p>
                <p className="text-sm text-red-700 mb-2">
                  The buyer has requested to cancel this order. Please review and take action.
                </p>
                {order.cancellationRequest.reason && (
                  <div className="bg-white border border-red-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-900">{order.cancellationRequest.reason}</p>
                  </div>
                )}
                <p className="text-xs text-red-600">
                  Requested on: {new Date(order.cancellationRequest.requestedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refusal Information */}
        {order.status === 'cancelled' && order.refusalReason && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  Delivery Refused by Buyer
                </p>
                <p className="text-sm text-orange-700 mb-2">
                  The buyer refused to accept this delivery on {order.refusalDate && new Date(order.refusalDate).toLocaleDateString()}
                </p>
                {order.refusalReason && (
                  <div className="bg-white border border-orange-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Refusal Reason:</p>
                    <p className="text-sm text-gray-900">{order.refusalReason}</p>
                  </div>
                )}
                {order.refusalProof && order.refusalProof.length > 0 && (
                  <div className="bg-white border border-orange-200 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Proof of Refusal ({order.refusalProof.length} {order.refusalProof.length === 1 ? 'file' : 'files'}):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {order.refusalProof.map((proof, index) => (
                        <a
                          key={index}
                          href={proof.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-2 border border-gray-200 rounded hover:border-orange-300 hover:bg-orange-50 transition-colors"
                        >
                          {proof.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={proof.fileUrl} 
                              alt={proof.fileName}
                              className="w-full h-20 object-cover rounded mb-1"
                            />
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center bg-gray-100 rounded mb-1">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <p className="text-xs text-gray-600 text-center truncate w-full">
                            {proof.fileName}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <Link
                href={`/manage-orders/${orderId}?tab=details`}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#103C2E] text-[#103C2E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order Details
              </Link>
              <Link
                href={`/manage-orders/${orderId}?tab=tracking`}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tracking'
                    ? 'border-[#103C2E] text-[#103C2E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order Tracking
              </Link>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{order.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{order.buyerEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </h3>
                    <div className="space-y-1 text-gray-700">
                      <p className="font-medium">{order.buyerName}</p>
                      <p>{order.deliveryAddress.street}</p>
                      {order.deliveryAddress.barangay && <p>{order.deliveryAddress.barangay}</p>}
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.province}</p>
                      <p>{order.deliveryAddress.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Items ({order.products.length})
                  </h3>
                  
                  <div className="space-y-4">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-600">
                            {product.quantity} {product.unit} × ₱{product.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">
                          ₱{(product.quantity * product.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₱{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">₱{order.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-[#103C2E]">₱{order.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Tracking
                  </h2>
                  
                  <div className="relative">
                    {trackingSteps.map((step, index) => (
                      <div key={step.status} className="relative flex items-start pb-8 last:pb-0">
                        {/* Timeline Line */}
                        {index < trackingSteps.length - 1 && (
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
                            {step.timestamp && step.completed && (
                              <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {new Date().toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} at {new Date().toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
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
                            This order has been cancelled. Contact the buyer if you have any questions.
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
                            Order is expected to be delivered by {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Lalamove Tracking */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E]">Delivery Tracking</h3>
                  <LalamoveTracker 
                    lalamoveOrderId={order.lalamove_order_id}
                    lalamoveShareLink={order.lalamove_share_link}
                    quotationId={order.lalamove_quotation_id}
                    orderStatus={order.status}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}