"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LalamoveOrderStatus } from '@/config/lalamove';
import LoadingDots from '@/components/ui/LoadingDots';

interface LalamoveOrder {
  orderId: string;
  quotationId: string;
  status: string;
  serviceType: string;
  stops: Array<{
    coordinates: { lat: string; lng: string };
    address: string;
    contact?: { name: string; phone: string };
  }>;
  price: {
    total: { amount: string; currency: string };
    base: { amount: string; currency: string };
    distance: { amount: string; currency: string };
    extraStops: { amount: string; currency: string };
  };
  shareLink: string;
  rider?: {
    name: string;
    phone: string;
    plateNumber: string;
    rating?: number;
  } | null;
  createdAt: string;
  driverAssignedAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
}

const STATUS_STEPS = [
  {
    key: LalamoveOrderStatus.ASSIGNING_DRIVER,
    label: 'Finding Driver',
    description: 'We are finding the best driver for your delivery',
    icon: '🔍'
  },
  {
    key: LalamoveOrderStatus.DRIVER_ALLOCATED,
    label: 'Driver Assigned',
    description: 'A driver has been assigned to your delivery',
    icon: '👨‍💼'
  },
  {
    key: LalamoveOrderStatus.PICKED_UP,
    label: 'Picked Up',
    description: 'Your order has been picked up',
    icon: '📦'
  },
  {
    key: LalamoveOrderStatus.ON_GOING,
    label: 'On the Way',
    description: 'Your order is on the way to the destination',
    icon: '🚛'
  },
  {
    key: LalamoveOrderStatus.COMPLETED,
    label: 'Delivered',
    description: 'Your order has been successfully delivered',
    icon: '✅'
  }
];

export default function LalamoveTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<LalamoveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderDetails = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const response = await fetch(`/api/lalamove/orders?orderId=${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Delivery order not found');
        }
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      
      // Auto-refresh every 30 seconds if order is not completed
      const interval = setInterval(() => {
        if (order && order.status !== LalamoveOrderStatus.COMPLETED && 
            order.status !== LalamoveOrderStatus.CANCELLED) {
          fetchOrderDetails(true);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [orderId, order?.status]);

  const getCurrentStepIndex = (status: string): number => {
    const index = STATUS_STEPS.findIndex(step => step.key === status);
    return index >= 0 ? index : 0;
  };

  const getStepStatus = (stepIndex: number, currentIndex: number, orderStatus: string): string => {
    if (orderStatus === LalamoveOrderStatus.CANCELLED) {
      return stepIndex === 0 ? 'current' : 'pending';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const formatPhoneNumber = (phone: string): string => {
    if (phone.startsWith('+63') && phone.length === 13) {
      return `+63 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingDots size="lg" color="#4A7C59" />
          <p className="mt-4 text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <header className="bg-[#103C2E] text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl md:text-2xl font-bold">HarvestHub</Link>
              <h1 className="text-lg md:text-xl font-semibold">Delivery Tracking</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchOrderDetails()}
              className="w-full bg-[#4A7C59] text-white py-2 px-4 rounded-lg hover:bg-[#3a6248] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === LalamoveOrderStatus.CANCELLED;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <header className="bg-[#103C2E] text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl md:text-2xl font-bold">HarvestHub</Link>
            <div className="text-center">
              <h1 className="text-lg md:text-xl font-semibold">Delivery Tracking</h1>
              <p className="text-sm text-green-200">Order ID: {orderId}</p>
            </div>
            <button
              onClick={() => fetchOrderDetails(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1a5540] transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Order Status Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCancelled ? 'Delivery Cancelled' : 
                   order.status === LalamoveOrderStatus.COMPLETED ? 'Delivery Completed' : 'Tracking Your Delivery'}
                </h2>
                <p className="text-gray-600">Service: {order.serviceType}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isCancelled ? 'bg-red-100 text-red-800' :
                order.status === LalamoveOrderStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="relative">
              <div className="flex justify-between items-center">
                {STATUS_STEPS.map((step, index) => {
                  const stepStatus = getStepStatus(index, currentStepIndex, order.status);
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                        stepStatus === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                        stepStatus === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                        'bg-gray-200 border-gray-300 text-gray-500'
                      }`}>
                        {stepStatus === 'completed' ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="text-center mt-2 max-w-24">
                        <p className="text-sm font-medium text-gray-900">{step.label}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Line */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
              
              <div className="space-y-4">
                {/* Pickup Location */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Pickup Location</p>
                  <p className="text-sm text-gray-600">{order.stops[0]?.address}</p>
                  {order.stops[0]?.contact && (
                    <p className="text-xs text-gray-500">
                      {order.stops[0].contact.name} • {formatPhoneNumber(order.stops[0].contact.phone)}
                    </p>
                  )}
                </div>

                {/* Delivery Location */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Delivery Location</p>
                  <p className="text-sm text-gray-600">{order.stops[1]?.address}</p>
                  {order.stops[1]?.contact && (
                    <p className="text-xs text-gray-500">
                      {order.stops[1].contact.name} • {formatPhoneNumber(order.stops[1].contact.phone)}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Delivery Fee</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₱{order.price.total.amount} {order.price.total.currency}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <p>Base: ₱{order.price.base.amount}</p>
                    <p>Distance: ₱{order.price.distance.amount}</p>
                    {parseFloat(order.price.extraStops.amount) > 0 && (
                      <p>Extra Stops: ₱{order.price.extraStops.amount}</p>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-700">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    {order.driverAssignedAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Driver Assigned:</span>
                        <span className="text-gray-700">{new Date(order.driverAssignedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {order.pickedUpAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Picked Up:</span>
                        <span className="text-gray-700">{new Date(order.pickedUpAt).toLocaleString()}</span>
                      </div>
                    )}
                    {order.completedAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Completed:</span>
                        <span className="text-gray-700">{new Date(order.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h3>
              
              {order.rider ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.rider.name}</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(order.rider.phone)}</p>
                      {order.rider.rating && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-600">{order.rider.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Vehicle</p>
                    <p className="text-sm text-gray-600">
                      {order.serviceType} • {order.rider.plateNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Looking for the best driver for your delivery...</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/orders"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                View All Orders
              </Link>
              <Link
                href="/"
                className="px-6 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3a6248] transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}