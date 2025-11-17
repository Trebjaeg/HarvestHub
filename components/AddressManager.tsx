"use client";

import { useState, useEffect } from 'react';
import { useAuthUserData } from '@/hooks/useAuthUserData';

interface Address {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  barangay: string;
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

// Barangays data for major cities
const CITY_BARANGAYS: Record<string, string[]> = {
  'Quezon City': [
    'Bagong Pag-asa', 'Bahay Toro', 'Balingasa', 'Bungad', 'Damar', 'Del Monte', 
    'Diliman', 'Don Manuel', 'Duyan-Duyan', 'E. Rodriguez', 'Escuela', 'Fairview', 
    'Greater Lagro', 'Gulod', 'Holy Spirit', 'Kaligayahan', 'Kamuning', 'Katipunan', 
    'Kaunlaran', 'La Loma', 'Libis', 'Lourdes', 'Loyola Heights', 'Maharlika', 
    'Malaya', 'Marilag', 'Masambong', 'Matandang Balara', 'Milagrosa', 'N.S. Amoranto', 
    'Nagkaisang Nayon', 'Nayong Kanluran', 'New Era', 'North Fairview', 'Novaliches Proper', 
    'Obrero', 'Old Balara', 'Paang Bundok', 'Pag-ibig sa Nayon', 'Pagkakaisa', 
    'Paligsahan', 'Paltok', 'Paraiso', 'Phil-Am', 'Pinagkaisahan', 'Poblacion', 
    'Project 6', 'Project 7', 'Project 8', 'Roxas', 'Sacred Heart', 'San Agustin', 
    'San Antonio', 'San Bartolome', 'San Isidro Labrador', 'San Jose', 'San Martin de Porres', 
    'San Roque', 'Santa Cruz', 'Santa Lucia', 'Santa Monica', 'Santa Teresita', 
    'Santo Cristo', 'Santo Domingo', 'Santo Niño', 'Siena', 'Silangan', 'Socorro', 
    'Tagumpay', 'Talayan', 'Tandang Sora', 'Teacher\'s Village East', 'Teacher\'s Village West', 
    'Tigbe', 'Ugong Norte', 'Unang Sigaw', 'UP Campus', 'Valencia', 'Vasra', 
    'Veterans Village', 'Villa Maria Clara', 'Violago Homes', 'West Triangle'
  ],
  'Manila': [
    'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 
    'Quiapo', 'Sampaloc', 'San Andres', 'San Miguel', 'San Nicolas', 'Santa Ana', 
    'Santa Cruz', 'Santa Mesa', 'Tondo'
  ],
  'Makati': [
    'Bangkal', 'Bel-Air', 'Carmona', 'Cembo', 'Comembo', 'Dasmariñas', 'East Rembo', 
    'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Kasilawan', 'La Paz', 
    'Magallanes', 'Olympia', 'Palanan', 'Pembo', 'Pinagkaisahan', 'Pio del Pilar', 
    'Poblacion', 'Post Proper Northside', 'Post Proper Southside', 'Rizal', 
    'San Antonio', 'San Isidro', 'San Lorenzo', 'Santa Cruz', 'Singkamas', 
    'South Cembo', 'Tejeros', 'Urdaneta', 'Valenzuela', 'West Rembo'
  ],
  'Pasig': [
    'Bagong Ilog', 'Bagong Katipunan', 'Bambang', 'Buting', 'Caniogan', 'Dela Paz', 
    'Kalawaan', 'Kapasigan', 'Kapitolyo', 'Malinao', 'Manggahan', 'Maybunga', 
    'Oranbo', 'Palatiw', 'Pinagbuhatan', 'Pineda', 'Rosario', 'Sagad', 'San Antonio', 
    'San Joaquin', 'San Jose', 'San Miguel', 'San Nicolas', 'Santa Cruz', 'Santa Lucia', 
    'Santa Rosa', 'Santo Tomas', 'Santolan', 'Sumilang', 'Ugong'
  ],
  // Bulacan Cities
  'Malolos': [
    'Anilao', 'Atlag', 'Babatnin', 'Bagna', 'Bagong Bayan', 'Balayong', 'Balite', 
    'Bangkal', 'Barihan', 'Bulihan', 'Bungahan', 'Caingin', 'Calero', 'Canalate', 
    'Cansanay', 'Guinhawa', 'Liang', 'Ligas', 'Longos', 'Look 1st', 'Look 2nd', 
    'Lugam', 'Mabolo', 'Masile', 'Matimbo', 'Mojon', 'Namayan', 'Niugan', 'Pamarawan', 
    'Panasahan', 'Pinagbakahan', 'San Agustin', 'San Gabriel', 'San Juan', 'San Pablo', 
    'San Vicente', 'Santiago', 'Santisima Trinidad', 'Santo Cristo', 'Santo Niño', 
    'Sumapang Bata', 'Sumapang Matanda', 'Taal', 'Tikay'
  ],
  'Santa Maria': [
    'Bagbaguin', 'Balasing', 'Buenavista', 'Camangyanan', 'Catmon', 'Cay Pombo', 
    'Caysio', 'Guyong', 'Lalakhan', 'Mag-asawang Sapa', 'Mahabang Parang', 'Parada', 
    'Poblacion', 'Pulong Buhangin', 'San Gabriel', 'San Jose Patag', 'Santa Clara', 
    'Santa Cruz', 'Santo Tomas', 'Silangan', 'Tabing Bakod', 'Tumana'
  ],
  'San Jose del Monte': [
    'Assumption', 'Bagong Buhay I', 'Bagong Buhay II', 'Bagong Buhay III', 'Citrus', 
    'Cruz na Daan', 'Dulong Bayan', 'Fatima I', 'Fatima II', 'Fatima III', 'Fatima IV', 
    'Fatima V', 'Francisco Homes-Guijo', 'Francisco Homes-Mulawin', 'Francisco Homes-Narra', 
    'Francisco Homes-Yakal', 'Gaya-gaya', 'Graceville', 'Gumaoc Central', 'Gumaoc East', 
    'Gumaoc West', 'Habay', 'Kaypian', 'Lawang Pari', 'Maharlika', 'Minuyan I', 
    'Minuyan II', 'Minuyan III', 'Minuyan IV', 'Minuyan V', 'Muzon', 'Paradise III', 
    'Poblacion', 'Sacred Heart Village', 'San Isidro', 'San Manuel', 'San Martin I', 
    'San Martin II', 'San Pedro', 'San Rafael I', 'San Rafael II', 'San Rafael III', 
    'San Rafael IV', 'San Rafael V', 'San Roque', 'Santa Cruz', 'Santo Cristo', 'Santo Niño I', 
    'Santo Niño II', 'Sapang Palay', 'Tungkong Mangga'
  ],
  'Meycauayan': [
    'Bagbaguin', 'Bahay Pare', 'Bancal', 'Banga', 'Bayugo', 'Camalig', 'Calvario', 
    'Hatol', 'Iba', 'Langka', 'Lawa', 'Libtong', 'Liputan', 'Longos', 'Malhacan', 
    'Pandayan', 'Pantoc', 'Perez', 'Poblacion', 'Saint Francis', 'Saluysoy', 'Tugatog', 
    'Ubihan', 'Zamora'
  ],
  'Marilao': [
    'Abangan Norte', 'Abangan Sur', 'Bancal', 'Ibayo', 'Lambakin', 'Lias', 'Loma de Gato', 
    'Patubig', 'Poblacion', 'Prenza I', 'Prenza II', 'Saog', 'Santa Rosa I', 'Santa Rosa II', 
    'Tabing Ilog'
  ]
};

// City zip codes mapping (4-digit Philippine zip codes)
const CITY_ZIP_CODES: Record<string, string> = {
  // Metro Manila
  'Manila': '1000',
  'Quezon City': '1100',
  'Makati': '1200',
  'Pasig': '1600',
  'Taguig': '1630',
  'Mandaluyong': '1550',
  'Pasay': '1300',
  'Caloocan': '1400',
  'Marikina': '1800',
  'San Juan': '1500',
  'Muntinlupa': '1770',
  'Parañaque': '1700',
  'Las Piñas': '1740',
  'Valenzuela': '1440',
  'Malabon': '1470',
  'Navotas': '1485',
  'Pateros': '1620',
  
  // Rizal
  'Antipolo': '1870',
  'Cainta': '1900',
  'Taytay': '1920',
  'Angono': '1930',
  'Binangonan': '1940',
  'Rodriguez': '1860',
  'San Mateo': '1850',
  'Tanay': '1980',
  'Teresa': '1880',
  'Morong': '1960',
  'Baras': '1970',
  'Cardona': '1950',
  'Jalajala': '1990',
  'Pililla': '1910',
  
  // Cavite
  'Bacoor': '4102',
  'Imus': '4103',
  'Dasmariñas': '4114',
  'Cavite City': '4100',
  'General Trias': '4107',
  'Rosario': '4106',
  'Silang': '4118',
  'Carmona': '4116',
  'General Mariano Alvarez': '4117',
  'Trece Martires': '4109',
  
  // Laguna
  'Calamba': '4027',
  'Santa Rosa': '4026',
  'Biñan': '4024',
  'San Pedro': '4023',
  'Los Baños': '4030',
  'Cabuyao': '4025',
  'San Pablo': '4000',
  'Sta. Cruz': '4009',
  'Pagsanjan': '4004',
  'Liliw': '4004',
  
  // Bulacan
  'Malolos': '3000',
  'Meycauayan': '3020',
  'San Jose del Monte': '3023',
  'Marilao': '3019',
  'Bocaue': '3018',
  'Balagtas': '3016',
  'Guiguinto': '3015',
  'Pandi': '3014',
  'Santa Maria': '3022',
  'Obando': '3021',
  
  // Pampanga
  'San Fernando': '2000',
  'Angeles': '2009',
  'Mabalacat': '2010',
  'Apalit': '2016',
  'Macabebe': '2018',
  'Masantol': '2017',
  'Mexico': '2021',
  'Santa Rita': '2001',
  'Guagua': '2003',
  'Lubao': '2005'
};

// Phone number validation
const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's empty
  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Must be exactly 11 digits and start with '09'
  if (cleanPhone.length !== 11) {
    return { isValid: false, message: 'Phone number must be exactly 11 digits' };
  }
  
  if (!cleanPhone.startsWith('09')) {
    return { isValid: false, message: 'Phone number must start with 09' };
  }
  
  return { isValid: true, message: '' };
};

// Format phone number for display with real-time formatting
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Only auto-add "09" if user starts with digits other than 0
  if (cleanPhone.length > 0 && !cleanPhone.startsWith('0')) {
    cleanPhone = '09' + cleanPhone;
  }
  
  // Limit to exactly 11 digits
  cleanPhone = cleanPhone.slice(0, 11);
  
  // Format as 09XX XXX XXXX
  if (cleanPhone.length >= 4) {
    if (cleanPhone.length <= 7) {
      return cleanPhone.replace(/(\d{4})(\d{0,3})/, '$1 $2');
    } else {
      return cleanPhone.replace(/(\d{4})(\d{3})(\d{0,4})/, '$1 $2 $3');
    }
  }
  
  return cleanPhone;
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
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
    latitude: undefined,
    longitude: undefined,
    isDefault: false,
    type: userRole === 'buyer' ? 'delivery' : 'pickup'
  });

  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    phone?: string;
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    label?: string;
  }>({});



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

    // Reset validation errors
    setValidationErrors({});
    const errors: { [key: string]: string } = {};

    // Validate required fields
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const validation = validatePhoneNumber(formData.phone);
      if (!validation.isValid) {
        errors.phone = validation.message;
      }
    }

    if (!formData.street.trim()) {
      errors.street = 'Street address is required';
    }

    if (!formData.barangay) {
      errors.barangay = 'Barangay is required';
    }

    if (!formData.city) {
      errors.city = 'City is required';
    }

    if (!formData.province) {
      errors.province = 'Province is required';
    }

    if (!formData.zipCode.trim()) {
      errors.zipCode = 'Zip code is required';
    } else if (!/^\d{4}$/.test(formData.zipCode)) {
      errors.zipCode = 'Zip code must be exactly 4 digits';
    } else if (formData.city && CITY_ZIP_CODES[formData.city] && CITY_ZIP_CODES[formData.city] !== formData.zipCode) {
      errors.zipCode = `Zip code for ${formData.city} should be ${CITY_ZIP_CODES[formData.city]}`;
    }

    if (!formData.label.trim()) {
      errors.label = 'Address label is required';
    }

    // If there are validation errors, display them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

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
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Address update error:', error);
        console.log('Response status:', response.status);
        console.log('Form data being sent:', formData);
        alert(`Failed to save address: ${error.message} (Status: ${response.status})`);
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
      barangay: address.barangay || '',
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
      barangay: '',
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



  const handleCityChange = (selectedCity: string) => {
    const zipCode = CITY_ZIP_CODES[selectedCity] || '';
    setFormData({ 
      ...formData, 
      city: selectedCity,
      barangay: '', // Reset barangay when city changes
      zipCode // Auto-generate zip code based on city
    });
    
    // Clear zip code validation error when city changes
    setValidationErrors(prev => ({ ...prev, zipCode: undefined }));
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

      <div className="space-y-6">
        <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Manage Addresses</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#4A7C59] hover:bg-[#3d6549] text-white py-2 px-4 rounded-lg font-medium transition-colors"
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
        <div className="bg-white border-2 border-[#4A7C59] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.label ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  maxLength={100}
                />
                {validationErrors.label && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.label}</p>
                )}
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  maxLength={100}
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                )}
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
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const formatted = formatPhoneNumber(rawValue);
                    setFormData({ ...formData, phone: formatted });
                  }}
                  placeholder="09XX XXX XXXX (11 digits required)"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  maxLength={13}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
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
                      city: '', // Reset city when province changes
                      barangay: '' // Reset barangay when province changes
                    });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.province ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Province</option>
                  {Object.keys(PROVINCE_CITIES).map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {validationErrors.province && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.province}</p>
                )}
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
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!formData.province}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent disabled:bg-gray-100 ${
                    validationErrors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select City</option>
                  {formData.province && PROVINCE_CITIES[formData.province]?.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barangay *
                </label>
                <select
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  disabled={!formData.city}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent disabled:bg-gray-100 ${
                    validationErrors.barangay ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Barangay</option>
                  {formData.city && CITY_BARANGAYS[formData.city]?.map((barangay) => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
                {validationErrors.barangay && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.barangay}</p>
                )}
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
                  placeholder="House No., Street Name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  maxLength={500}
                />
                {validationErrors.street && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.street}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                  Zip Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  maxLength={10}
                />
                  onChange={(e) => {
                    // Only allow digits and limit to 4 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({ ...formData, zipCode: value });
                  }}
                  onKeyDown={(e) => {
                    // Allow backspace, delete, tab, escape, enter
                    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                      e.preventDefault();
                    }
                    // Prevent input if already at 4 digits
                    if (e.currentTarget.value.length >= 4 && ![8, 46].includes(e.keyCode)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={formData.city && CITY_ZIP_CODES[formData.city] ? 
                    `Auto: ${CITY_ZIP_CODES[formData.city]}` : "4-digit ZIP Code"}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    validationErrors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={4}
                  required
                />
                {validationErrors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>
                )}
                {formData.city && CITY_ZIP_CODES[formData.city] && (
                  <p className="text-sm text-gray-500 mt-1">
                    Expected ZIP code for {formData.city}: {CITY_ZIP_CODES[formData.city]}
                  </p>
                )}
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
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#4A7C59] hover:bg-[#3d6549] text-white py-2 rounded-lg font-medium transition-colors"
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
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
          <p className="mt-1 text-sm text-gray-500 px-4 sm:px-0">
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'buyer' 
              ? 'Get started by adding a delivery address' 
              : 'Get started by adding a pickup location'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p>{address.barangay && `${address.barangay}, `}{address.city}, {address.province} {address.zipCode}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex-1 text-sm text-[#4A7C59] hover:bg-[#4A7C59] hover:text-white border border-[#4A7C59] py-1.5 rounded transition-colors"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id!)}
                    className="flex-1 text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-100 border border-gray-300 py-1.5 rounded transition-colors touch-manipulation"
                    className="flex-1 text-sm text-gray-600 hover:bg-gray-100 border border-gray-300 py-1.5 rounded transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address._id!)}
                  className="text-sm text-red-600 hover:bg-red-50 active:bg-red-50 border border-red-300 px-3 py-1.5 rounded transition-colors touch-manipulation"
                  className="text-sm text-red-600 hover:bg-red-50 border border-red-300 px-3 py-1.5 rounded transition-colors"
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
