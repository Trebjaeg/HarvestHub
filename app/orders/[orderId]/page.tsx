"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
  }[];
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
  paymentMethod: string;
  orderDate: string;
  estimatedDelivery?: string;
  sellerName: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A7C59] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
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
          <p className="mt-4 text-gray-600">{error}</p>
          <Link href="/" className="mt-4 inline-block text-[#4A7C59] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#103C2E] text-white py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-xl md:text-2xl font-bold">HarvestHub</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">Thank you for your order. We'll send you updates via email.</p>
            <div className="inline-block bg-gray-100 px-4 py-2 rounded">
              <span className="text-sm text-gray-600">Order Number: </span>
              <span className="font-semibold text-gray-900">{order.orderNumber}</span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium uppercase">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Status</p>
              <p className="font-medium capitalize">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {order.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <p className="font-medium capitalize">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Seller</h3>
            <p className="text-gray-700">{order.sellerName}</p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
          <p className="text-gray-700">{order.deliveryAddress.street}</p>
          <p className="text-gray-700">{order.deliveryAddress.city}, {order.deliveryAddress.province} {order.deliveryAddress.zipCode}</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.products.map((product, index) => (
              <div key={index} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-600">{product.quantity} {product.unit} × ₱{product.price.toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-900">₱{(product.quantity * product.price).toFixed(2)}</p>
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
              <span className="text-[#4A7C59]">₱{order.finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/"
            className="flex-1 bg-[#4A7C59] hover:bg-[#3d6549] text-white text-center py-3 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </Link>
          <Link 
            href="/my-profile?tab=orders"
            className="flex-1 bg-white hover:bg-gray-50 text-[#4A7C59] border-2 border-[#4A7C59] text-center py-3 rounded-lg font-semibold transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
