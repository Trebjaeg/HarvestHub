"use client";

import { useState, useEffect } from 'react';
import { useAuthUserData } from '@/hooks/useAuthUserData';

interface Address {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  type: 'delivery' | 'pickup' | 'both';
}

// Philippine provinces and cities data
const PROVINCE_CITIES: Record<string, string[]> = {
  'Metro Manila': [
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 
    'Pasay', 'Caloocan', 'Marikina', 'San Juan', 'Muntinlupa', 'Parañaque', 
    'Las Piñas', 'Valenzuela', 'Malabon', 'Navotas', 'Pateros'
  ],
  'Rizal': [
    'Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Rodriguez', 
    'San Mateo', 'Tanay', 'Teresa', 'Morong', 'Baras', 'Cardona', 'Jalajala', 'Pililla'
  ],
  'Cavite': [
    'Bacoor', 'Imus', 'Dasmariñas', 'Cavite City', 'Las Piñas', 'General Trias', 
    'Rosario', 'Silang', 'Carmona', 'General Mariano Alvarez', 'Trece Martires'
  ],
  'Laguna': [
    'Calamba', 'Santa Rosa', 'Biñan', 'San Pedro', 'Los Baños', 'Cabuyao', 
    'San Pablo', 'Sta. Cruz', 'Pagsanjan', 'Liliw'
  ],
  'Bulacan': [
    'Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 
    'Balagtas', 'Guiguinto', 'Pandi', 'Santa Maria', 'Obando'
  ],
  'Pampanga': [
    'San Fernando', 'Angeles', 'Mabalacat', 'Apalit', 'Macabebe', 'Masantol', 
    'Mexico', 'Santa Rita', 'Guagua', 'Lubao'
  ]
};

export default function AddressManager({ userRole }: { userRole: 'buyer' | 'seller' | 'farmer' }) {
  const { user } = useAuthUserData();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>({
    label: '',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    zipCode: '',
    latitude: undefined,
    longitude: undefined,
    isDefault: false,
    type: userRole === 'buyer' ? 'delivery' : 'pickup'
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Request timed out fetching addresses');
      } else {
        console.error('Error fetching addresses:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addresses.length >= 3 && !editingId) {
      alert('You can only have up to 3 addresses. Please delete one to add a new address.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = editingId 
        ? `/api/user/addresses/${editingId}` 
        : '/api/user/addresses';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await fetchAddresses();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save address');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        console.error('Error saving address:', error);
        alert('An error occurred while saving the address');
      }
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode || '',
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
      type: address.type
    });
    setEditingId(address._id || null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      fullName: '',
      phone: '',
      street: '',
      city: '',
      province: '',
      zipCode: '',
      latitude: undefined,
      longitude: undefined,
      isDefault: false,
      type: userRole === 'buyer' ? 'delivery' : 'pickup'
    });
    setEditingId(null);
  };

  const handleSetDefault = async (id: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/user/addresses/${id}/set-default`, {
        method: 'PATCH',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await fetchAddresses();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to set default address');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        console.error('Error setting default address:', error);
        alert('An error occurred while setting default address');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await fetchAddresses();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete address');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        console.error('Error deleting address:', error);
        alert('An error occurred while deleting the address');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A7C59]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Addresses</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-[#4A7C59] hover:bg-[#3d6549] active:bg-[#3d6549] text-white py-2 px-4 rounded-lg font-medium transition-colors touch-manipulation"
          >
            Add Address
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-[#4A7C59] rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Label *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder={userRole === 'buyer' ? 'e.g., Home, Office' : 'e.g., Farm, Warehouse, Shop'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  required
                  maxLength={100}
                />
              </div>

              {userRole !== 'buyer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'delivery' | 'pickup' | 'both' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                    required
                  >
                    <option value="pickup">Pickup Only</option>
                    <option value="delivery">Delivery Only</option>
                    <option value="both">Pickup & Delivery</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      province: e.target.value,
                      city: '' // Reset city when province changes
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  required
                >
                  <option value="">Select Province</option>
                  {Object.keys(PROVINCE_CITIES).map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City/Municipality *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.province}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent disabled:bg-gray-100"
                  required
                >
                  <option value="">Select City</option>
                  {formData.province && PROVINCE_CITIES[formData.province]?.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="House No., Street Name, Barangay"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  required
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-[#4A7C59] focus:ring-[#4A7C59] border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="w-full bg-[#4A7C59] hover:bg-[#3d6549] active:bg-[#3d6549] text-white py-2.5 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation"
              >
                {editingId ? 'Update Address' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-300 text-gray-700 py-2.5 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
          <p className="mt-1 text-sm text-gray-500 px-4 sm:px-0">
            {userRole === 'buyer' 
              ? 'Get started by adding a delivery address' 
              : 'Get started by adding a pickup location'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{" "}
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white border-2 rounded-lg p-4 relative ${
                address.isDefault ? 'border-[#4A7C59]' : 'border-gray-200'
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-2 right-2 bg-[#4A7C59] text-white text-xs px-2 py-1 rounded">
                  Default
                </span>
              )}
              
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {address.label}
                  {userRole !== 'buyer' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                      {address.type}
                    </span>
                  )}
                </h3>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p className="font-medium text-gray-900">{address.fullName}</p>
                <p>{address.phone}</p>
                <p>{address.street}</p>
                <p>{address.city}, {address.province} {address.zipCode}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex-1 text-sm text-[#4A7C59] hover:bg-[#4A7C59] hover:text-white active:bg-[#4A7C59] active:text-white border border-[#4A7C59] py-1.5 rounded transition-colors touch-manipulation"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id!)}
                    className="flex-1 text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-100 border border-gray-300 py-1.5 rounded transition-colors touch-manipulation"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address._id!)}
                  className="text-sm text-red-600 hover:bg-red-50 active:bg-red-50 border border-red-300 px-3 py-1.5 rounded transition-colors touch-manipulation"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addresses.length >= 3 && (
        <p className="text-sm text-gray-500 text-center">
          You've reached the maximum limit of 3 addresses. Delete one to add a new address.
        </p>
      )}
    </div>
  );
}
