"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import LoadingDots from '@/components/ui/LoadingDots';

interface CheckoutItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  productImage?: string;
  unit: string;
  sellerId: string;
  sellerName: string;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

interface SavedAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zipCode?: string;
  isDefault: boolean;
  type: 'delivery' | 'pickup' | 'both';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthUserData();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  
  // Form data
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    zipCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, gcash, paymaya

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Get checkout data from sessionStorage
    const data = sessionStorage.getItem('checkoutItems');
    if (!data) {
      router.push('/cart');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setCheckoutData(parsedData);
    } catch (error) {
      console.error('Error parsing checkout data:', error);
      router.push('/cart');
    } finally {
      setLoading(false);
    }

    // Fetch saved addresses
    fetchSavedAddresses();
  }, [isAuthenticated, router]);

  const fetchSavedAddresses = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increase to 15 seconds

    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const deliveryAddresses = data.addresses.filter((addr: SavedAddress) => 
          addr.type === 'delivery' || addr.type === 'both'
        );
        setSavedAddresses(deliveryAddresses);
        
        // Auto-select default address if available
        const defaultAddr = deliveryAddresses.find((addr: SavedAddress) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          setShippingAddress({
            fullName: defaultAddr.fullName,
            phone: defaultAddr.phone,
            street: defaultAddr.street,
            city: defaultAddr.city,
            province: defaultAddr.province,
            zipCode: defaultAddr.zipCode || ''
          });
        } else if (deliveryAddresses.length === 0) {
          setUseNewAddress(true);
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Request timed out fetching addresses');
      } else {
        console.error('Error fetching addresses:', error);
      }
      // Fallback to manual entry if addresses can't be loaded
      setUseNewAddress(true);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(addr => addr._id === addressId);
    if (selected) {
      setShippingAddress({
        fullName: selected.fullName,
        phone: selected.phone,
        street: selected.street,
        city: selected.city,
        province: selected.province,
        zipCode: selected.zipCode || ''
      });
      setUseNewAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || 
        !shippingAddress.city || !shippingAddress.province) {
      alert('Please fill in all shipping address fields');
      return;
    }

    setPlacing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for order creation

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: checkoutData?.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            sellerId: item.sellerId
          })),
          shippingAddress,
          paymentMethod,
          subtotal: checkoutData?.subtotal,
          shippingFee: checkoutData?.shippingFee,
          total: checkoutData?.total
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Clear checkout data
        sessionStorage.removeItem('checkoutItems');
        
        // Navigate to order confirmation
        router.push(`/orders/${data.orderId}`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to place order');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error placing order:', error);
      if (error.name === 'AbortError') {
        alert('Request timed out. Please check your connection and try again.');
      } else {
        alert('An error occurred while placing your order');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingDots size="lg" color="#4A7C59" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#103C2E] text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl md:text-2xl font-bold">HarvestHub</Link>
            <h1 className="text-lg md:text-xl font-semibold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
              
              {/* Saved Addresses Selection */}
              {savedAddresses.length > 0 && !useNewAddress && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Saved Address</label>
                  <div className="space-y-2">
                    {savedAddresses.map((address) => (
                      <label 
                        key={address._id}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address._id 
                            ? 'border-[#4A7C59] bg-green-50' 
                            : 'border-gray-200 hover:border-[#4A7C59]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selectedAddressId === address._id}
                          onChange={() => handleAddressSelect(address._id)}
                          className="mt-1 w-4 h-4 text-[#4A7C59] focus:ring-[#4A7C59]"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-[#4A7C59] text-white px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{address.fullName} | {address.phone}</p>
                          <p className="text-sm text-gray-600">{address.street}, {address.city}, {address.province} {address.zipCode}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUseNewAddress(true);
                      setSelectedAddressId(null);
                      setShippingAddress({
                        fullName: '',
                        phone: '',
                        street: '',
                        city: '',
                        province: '',
                        zipCode: ''
                      });
                    }}
                    className="mt-3 text-[#4A7C59] hover:underline text-sm font-medium"
                  >
                    + Use a new address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseNewAddress(false);
                        const defaultAddr = savedAddresses.find(addr => addr.isDefault);
                        if (defaultAddr) {
                          handleAddressSelect(defaultAddr._id);
                        }
                      }}
                      className="mb-4 text-[#4A7C59] hover:underline text-sm font-medium flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M15 6l-6 6l6 6" />
                      </svg>
                      Back to saved addresses
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="House No., Street Name, Barangay"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="City/Municipality"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                      <input
                        type="text"
                        value={shippingAddress.province}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4A7C59] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-[#4A7C59] focus:ring-[#4A7C59]"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900">Cash on Delivery (COD)</span>
                    <span className="block text-sm text-gray-500">Pay when you receive your order</span>
                  </span>
                </label>
                
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4A7C59] transition-colors opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    disabled
                    className="w-4 h-4 text-[#4A7C59] focus:ring-[#4A7C59]"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900">GCash</span>
                    <span className="block text-sm text-gray-500">Coming soon</span>
                  </span>
                </label>
                
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4A7C59] transition-colors opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="paymaya"
                    disabled
                    className="w-4 h-4 text-[#4A7C59] focus:ring-[#4A7C59]"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900">PayMaya</span>
                    <span className="block text-sm text-gray-500">Coming soon</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {checkoutData.items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-3 pb-3 border-b">
                    {item.productImage && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-sm text-gray-500">{item.quantity} {item.unit} × ₱{item.pricePerUnit.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">₱{item.totalPrice.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 py-4 border-t border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({checkoutData.items.length} items)</span>
                  <span className="font-medium">₱{checkoutData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Fee</span>
                  <span className="font-medium">₱{checkoutData.shippingFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 mb-6">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-[#4A7C59]">₱{checkoutData.total.toFixed(2)}</span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full bg-[#4A7C59] hover:bg-[#3d6549] text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {placing ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Placing order...</span>
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              <Link href="/cart" className="block text-center text-[#4A7C59] hover:underline mt-4">
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
