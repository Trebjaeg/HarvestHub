"use client";

import { useState, useEffect } from 'react';
import { LalamoveOrderStatus } from '@/config/lalamove';

interface LalamoveOrder {
  lalamoveOrderId: string;
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
  };
  rider?: {
    name: string;
    phone: string;
    plateNumber: string;
    rating?: number;
  } | null;
  createdAt: Date;
}

interface TestRider {
  name: string;
  phone: string;
  plateNumber: string;
  rating: number;
}

export default function LalamoveSimulatorPage() {
  const [orders, setOrders] = useState<LalamoveOrder[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [testRiders, setTestRiders] = useState<TestRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/lalamove/simulator/webhook');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.allOrders || []);
        setAvailableStatuses(data.availableStatuses || []);
        setTestRiders(data.testRiders || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch('/api/lalamove/simulator/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lalamoveOrderId: orderId,
          status: newStatus
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Status updated:', result);
        
        // Refresh the orders list
        await fetchData();
        
        alert(`Order ${orderId} status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LalamoveOrderStatus.ASSIGNING_DRIVER:
        return 'bg-yellow-100 text-yellow-800';
      case LalamoveOrderStatus.DRIVER_ALLOCATED:
        return 'bg-blue-100 text-blue-800';
      case LalamoveOrderStatus.PICKED_UP:
        return 'bg-purple-100 text-purple-800';
      case LalamoveOrderStatus.ON_GOING:
        return 'bg-orange-100 text-orange-800';
      case LalamoveOrderStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = [
      LalamoveOrderStatus.ASSIGNING_DRIVER,
      LalamoveOrderStatus.DRIVER_ALLOCATED,
      LalamoveOrderStatus.PICKED_UP,
      LalamoveOrderStatus.ON_GOING,
      LalamoveOrderStatus.COMPLETED
    ];
    
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A7C59] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading simulator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <header className="bg-[#103C2E] text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold">Lalamove Simulator</h1>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A7C59] rounded-lg hover:bg-[#3a6248] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 Demo Instructions</h2>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• This simulator lets you update delivery status for demo purposes</p>
              <p>• Click "Next Status" to advance orders through the delivery flow</p>
              <p>• Status progression: Assigning Driver → Driver Allocated → Picked Up → On Going → Completed</p>
              <p>• Orders will show real-time updates on the tracking page</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h.01M6 9h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-600">Place an order through checkout to see it here for testing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              
              return (
                <div key={order.lalamoveOrderId} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order: {order.lalamoveOrderId}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">Service Type</p>
                          <p className="font-medium">{order.serviceType}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600 mb-1">Total Fee</p>
                          <p className="font-medium">₱{order.price.total.amount}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600 mb-1">Pickup</p>
                          <p className="font-medium">{order.stops[0]?.address}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600 mb-1">Delivery</p>
                          <p className="font-medium">{order.stops[1]?.address}</p>
                        </div>
                        
                        {order.rider && (
                          <div className="md:col-span-2">
                            <p className="text-gray-600 mb-1">Assigned Driver</p>
                            <p className="font-medium">
                              {order.rider.name} • {order.rider.phone} • {order.rider.plateNumber}
                              {order.rider.rating && ` • ⭐ ${order.rider.rating}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col gap-2">
                      {nextStatus && (
                        <button
                          onClick={() => updateOrderStatus(order.lalamoveOrderId, nextStatus)}
                          disabled={updating === order.lalamoveOrderId}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                            updating === order.lalamoveOrderId
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-[#4A7C59] hover:bg-[#3a6248]'
                          }`}
                        >
                          {updating === order.lalamoveOrderId ? 'Updating...' : `Next: ${nextStatus.replace(/_/g, ' ')}`}
                        </button>
                      )}
                      
                      <a
                        href={`/track/lalamove/${order.lalamoveOrderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                      >
                        View Tracking
                      </a>
                      
                      {order.status === LalamoveOrderStatus.COMPLETED && (
                        <div className="text-center">
                          <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Test Riders Info */}
        {testRiders.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Test Drivers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testRiders.map((rider, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{rider.name}</h4>
                    <p className="text-sm text-gray-600">{rider.phone}</p>
                    <p className="text-sm text-gray-600">{rider.plateNumber}</p>
                    <p className="text-sm text-gray-600">⭐ {rider.rating}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * Drivers are automatically assigned when orders reach "Driver Allocated" status
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}