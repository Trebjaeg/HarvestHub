"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import LoadingDots from '@/components/ui/LoadingDots';
import { calculateDeliveryFees, getDeliveryFee, isDeliveryAvailable, VEHICLE_OPTIONS, getVehicleConfig } from '@/lib/delivery-calculator';

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
  barangay?: string;
  city: string;
  province: string;
  zipCode?: string;
  isDefault: boolean;
  type: 'delivery' | 'pickup' | 'both';
}

interface DeliveryOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
  fee: number;
  overweight?: boolean;
}

// Vehicle configuration for weight limits
const VEHICLE_CONFIG: { [key: string]: { max: number } } = {
  MOTORCYCLE: { max: 20 },
  SEDAN: { max: 50 },
  MPV: { max: 100 },
  VAN: { max: 200 },
  TRUCK: { max: 500 }
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthUserData();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('MOTORCYCLE');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState<number>(0);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    zipCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    description: string;
    type: string;
    discount: number;
    freeDelivery: boolean;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState<Array<{
    code: string;
    description: string;
    type: string;
  }>>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const data = sessionStorage.getItem('checkoutItems');
    if (!data) {
      router.push('/cart');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setCheckoutData(parsedData);
    } catch {
      router.push('/cart');
    } finally {
      setLoading(false);
    }

    fetchSavedAddresses();
    fetchAvailableVouchers();
  }, [isAuthenticated, router]);

  const fetchAvailableVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers/available', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableVouchers(data.vouchers || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  // Calculate delivery options when address province changes
  useEffect(() => {
    if (shippingAddress.province && checkoutData) {
      // Calculate total weight from items - FIXED FOR ACCURATE WEIGHT
      const totalWeight = checkoutData.items.reduce((sum, item) => {
        const unit = item.unit.toLowerCase().trim();
        
        // Use QUANTITY and UNIT - not product name!
        // If unit contains 'kg' or 'kilo', the quantity IS the weight in kg
        if (unit.includes('kg') || unit.includes('kilo')) {
          return sum + item.quantity; // 1 kg = 1 kg exactly
        }
        // If unit is 'g' or 'gram', convert to kg
        else if (unit.includes('g') && !unit.includes('kg')) {
          return sum + (item.quantity / 1000); // 1000g = 1kg
        }
        // For bundles/bunches - check product name for weight
        else if (unit.includes('bundle') || unit.includes('bunch')) {
          const productName = item.productName.toLowerCase();
          const weightMatch = productName.match(/(\d+(?:\.\d+)?)\s*kg/i);
          if (weightMatch) {
            const weightPerBundle = parseFloat(weightMatch[1]);
            return sum + (item.quantity * weightPerBundle);
          }
          // Default bundle weight if not specified
          return sum + (item.quantity * 1.5);
        }
        // For sacks, estimate 25 kg each
        else if (unit.includes('sack') || unit.includes('bag')) {
          return sum + (item.quantity * 25);
        }
        // For pieces, estimate 0.3 kg each (lighter default)
        else {
          return sum + (item.quantity * 0.3);
        }
      }, 0);

      console.log('Calculated weight:', totalWeight, 'kg from items:', checkoutData.items);

      const options = calculateDeliveryFees(
        shippingAddress.province,
        shippingAddress.city,
        totalWeight,
        checkoutData.subtotal
      );
      setDeliveryOptions(options);
      
      // AUTO-SELECT RECOMMENDED VEHICLE based on weight
      const recommendedOption = options.find(opt => opt.description.includes('⭐ Recommended'));
      const vehicleToSelect = recommendedOption?.type || 'MOTORCYCLE';
      
      // Only update if different from current selection
      if (vehicleToSelect !== selectedVehicle) {
        setSelectedVehicle(vehicleToSelect);
      }
      
      // Update selected vehicle fee
      const selectedOption = options.find(opt => opt.type === vehicleToSelect);
      if (selectedOption) {
        setCurrentDeliveryFee(selectedOption.fee);
        // Update checkout data with new shipping fee
        setCheckoutData(prev => prev ? {
          ...prev,
          shippingFee: selectedOption.fee,
          total: prev.subtotal + selectedOption.fee
        } : null);
      }
    }
  }, [shippingAddress.province, shippingAddress.city, checkoutData?.subtotal]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const deliveryAddresses = data.addresses.filter((addr: SavedAddress) => 
          addr.type === 'delivery' || addr.type === 'both'
        );
        setSavedAddresses(deliveryAddresses);

        // Auto-select default address
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
        }
      }
    } catch (error) {
      // Only log if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching addresses:', error);
      }
    }
  };

  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddressId(address._id);
    setUseNewAddress(false);
    setShippingAddress({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode || ''
    });
  };

  const handleVehicleSelect = (vehicleType: string) => {
    // Prevent selection of overweight vehicles
    const selectedOption = deliveryOptions.find(opt => opt.type === vehicleType);
    if (selectedOption?.description.includes('⚠️ Overweight')) {
      alert('This vehicle cannot carry your order weight. Please select a larger vehicle.');
      return;
    }
    
    setSelectedVehicle(vehicleType);
    if (selectedOption && checkoutData) {
      setCurrentDeliveryFee(selectedOption.fee);
      setCheckoutData(prev => prev ? {
        ...prev,
        shippingFee: selectedOption.fee,
        total: prev.subtotal + selectedOption.fee
      } : null);
    }
  };

  const validateForm = () => {
    if (!shippingAddress.fullName?.trim()) {
      alert('Please enter your full name');
      return false;
    }
    if (!shippingAddress.phone?.trim()) {
      alert('Please enter your phone number');
      return false;
    }
    if (!shippingAddress.street?.trim()) {
      alert('Please enter your street address');
      return false;
    }
    if (!shippingAddress.city?.trim()) {
      alert('Please enter your city');
      return false;
    }
    if (!shippingAddress.province?.trim()) {
      alert('Please enter your province');
      return false;
    }

    // Check if delivery is available to the province
    if (!isDeliveryAvailable(shippingAddress.province)) {
      alert('Sorry, delivery is not available to your province at this time. Please contact support for assistance.');
      return false;
    }

    return true;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    if (!checkoutData) {
      setVoucherError('Checkout data not loaded');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

    try {
      console.log('Applying voucher:', voucherCode, 'Subtotal:', checkoutData.subtotal);
      
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          code: voucherCode.toUpperCase().trim(),
          subtotal: checkoutData.subtotal
        })
      });

      const data = await response.json();
      console.log('Voucher validation response:', data);

      if (!response.ok) {
        console.error('Voucher validation failed:', data);
        setVoucherError(data.error || 'Invalid voucher code');
        setAppliedVoucher(null);
        return;
      }

      console.log('Voucher applied successfully:', data.voucher);
      setAppliedVoucher(data.voucher);
      setVoucherError('');
      
      // If it's a free delivery voucher, set delivery fee to 0
      if (data.voucher.freeDelivery) {
        console.log('Setting delivery fee to 0 for free delivery voucher');
        setCurrentDeliveryFee(0);
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      setVoucherError('Failed to apply voucher. Please try again.');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    
    // Recalculate delivery fee from selected vehicle
    if (shippingAddress.province) {
      const fee = getDeliveryFee(shippingAddress.province, selectedVehicle);
      setCurrentDeliveryFee(fee);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || !checkoutData) return;

    setPlacing(true);

    try {
      const orderData = {
        items: checkoutData.items,
        shippingAddress,
        paymentMethod,
        shippingFee: currentDeliveryFee,
        lalamoveQuotationId: `MOCK-QUOTE-${Date.now()}`, // Mock quotation for demo
        deliveryDetails: {
          vehicleType: selectedVehicle,
          deliveryFee: currentDeliveryFee,
          estimatedTime: deliveryOptions.find(opt => opt.type === selectedVehicle)?.estimatedTime
        },
        pricing: {
          subtotal: checkoutData.subtotal,
          shippingFee: currentDeliveryFee,
          total: checkoutData.subtotal + currentDeliveryFee
        }
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear checkout data from session storage
        sessionStorage.removeItem('checkoutItems');
        
        // Redirect to order confirmation
        router.push(`/orders/${result.orderId}?success=true`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No items to checkout</h1>
          <Link href="/cart" className="text-green-600 hover:underline">
            Go back to cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/cart" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4 font-medium"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {checkoutData.items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Seller: {item.sellerName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × ₱{item.pricePerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₱{item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !useNewAddress && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Select saved address:</h3>
                  <div className="space-y-3">
                    {savedAddresses.map((address) => (
                      <div
                        key={address._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAddressSelect(address)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{address.fullName}</p>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600">
                                {address.street}, {address.barangay && `${address.barangay}, `}{address.city}, {address.province}
                              {address.zipCode && ` ${address.zipCode}`}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {address.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="mt-3 text-green-600 hover:underline text-sm"
                  >
                    Use a different address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setUseNewAddress(false)}
                      className="text-green-600 hover:underline text-sm mb-4"
                    >
                      ← Back to saved addresses
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Province *"
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Options */}
            {deliveryOptions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Total Weight: <span className="font-semibold">{checkoutData.items.reduce((sum, item) => {
                    const unit = item.unit.toLowerCase().trim();
                    if (unit.includes('kg') || unit.includes('kilo')) return sum + item.quantity;
                    else if (unit.includes('bundle') || unit.includes('bunch')) {
                      const weightMatch = item.productName.toLowerCase().match(/(\d+(?:\.\d+)?)\s*kg/i);
                      return sum + (weightMatch ? item.quantity * parseFloat(weightMatch[1]) : item.quantity * 1.5);
                    }
                    return sum + (item.quantity * 0.3);
                  }, 0).toFixed(1)} kg</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {deliveryOptions.map((option) => {
                    const isOverweight = option.overweight || option.description.includes('⚠️ Overweight');
                    const isRecommended = option.description.includes('⭐ Recommended');
                    const isDisabled = isOverweight;
                    
                    return (
                      <div
                        key={option.type}
                        className={`relative p-4 border-2 rounded-lg transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300'
                            : selectedVehicle === option.type
                            ? 'border-green-500 bg-green-50 cursor-pointer shadow-lg ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-400 hover:shadow-md cursor-pointer bg-white'
                        }`}
                        onClick={() => !isDisabled && handleVehicleSelect(option.type)}
                      >
                        {/* Disabled Overlay */}
                        {isDisabled && (
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-60 rounded-lg flex items-center justify-center z-10">
                            <div className="text-center">
                              <span className="text-4xl">🚫</span>
                              <p className="text-xs font-bold text-red-700 mt-1">TOO HEAVY</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`text-3xl mb-2 ${isDisabled ? 'grayscale opacity-50' : ''}`}>
                            {option.icon}
                          </div>
                          <h3 className={`font-semibold mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                            {option.name}
                          </h3>
                          
                          {/* Recommended or Overweight Badge */}
                          {isRecommended && !isDisabled && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                ⭐ Best Choice
                              </span>
                            </div>
                          )}
                          {isOverweight && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                ⚠️ Max {VEHICLE_CONFIG[option.type]?.max || 20}kg
                              </span>
                            </div>
                          )}
                          
                          <p className={`text-xs mb-2 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            {option.estimatedTime}
                          </p>
                          <p className={`font-bold text-xl ${
                            isDisabled 
                              ? 'text-gray-400' 
                              : selectedVehicle === option.type
                              ? 'text-green-700'
                              : 'text-green-600'
                          }`}>
                            ₱{option.fee}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when your order is delivered</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Voucher Input */}
              <div className="mb-4 pb-4 border-b">
                <label className="block text-sm font-medium mb-2">Voucher Code</label>
                {!appliedVoucher ? (
                  <>
                    {/* Available Vouchers Dropdown */}
                    {availableVouchers.length > 0 && (
                      <div className="mb-2">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setVoucherCode(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          disabled={voucherLoading}
                        >
                          <option value="">Select a voucher</option>
                          {availableVouchers.map((voucher) => (
                            <option key={voucher.code} value={voucher.code}>
                              {voucher.code} - {voucher.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Manual Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Or enter voucher code"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={voucherLoading}
                      />
                      <button
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCode.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {voucherLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-green-700">{appliedVoucher.code}</div>
                      <div className="text-xs text-green-600">{appliedVoucher.description}</div>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {voucherError && (
                  <p className="text-sm text-red-600 mt-1">{voucherError}</p>
                )}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₱{checkoutData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="ml-4">VATable Amount</span>
                  <span>₱{(checkoutData.subtotal / 1.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="ml-4">VAT (12%)</span>
                  <span>₱{(checkoutData.subtotal - (checkoutData.subtotal / 1.12)).toFixed(2)}</span>
                </div>
                {appliedVoucher && appliedVoucher.type !== 'free_delivery' && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount</span>
                    <span>-₱{appliedVoucher.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={appliedVoucher?.freeDelivery ? 'line-through text-gray-400' : ''}>
                    ₱{currentDeliveryFee.toFixed(2)}
                  </span>
                </div>
                {appliedVoucher?.freeDelivery && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Free Delivery Applied!</span>
                    <span>-₱{currentDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₱{(
                      checkoutData.subtotal 
                      - (appliedVoucher && appliedVoucher.type !== 'free_delivery' ? appliedVoucher.discount : 0)
                      + (appliedVoucher?.freeDelivery ? 0 : currentDeliveryFee)
                    ).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !shippingAddress.province || deliveryOptions.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {placing ? (
                  <span className="flex items-center justify-center">
                    <LoadingDots />
                    <span className="ml-2">Placing Order...</span>
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>

              {!shippingAddress.province && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please enter your delivery address to see shipping options
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

