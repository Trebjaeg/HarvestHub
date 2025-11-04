"use client";

import { useState, useEffect } from 'react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLat, 
  initialLng, 
  isOpen, 
  onClose 
}: LocationPickerProps) {
  const [latitude, setLatitude] = useState<string>(initialLat?.toString() || '');
  const [longitude, setLongitude] = useState<string>(initialLng?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Auto-detect user's current location on mount
  useEffect(() => {
    if (isOpen && !initialLat && !initialLng) {
      detectCurrentLocation();
    }
  }, [isOpen, initialLat, initialLng]);

  const detectCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          setLoading(false);
        },
        (error) => {
          console.error('Error detecting location:', error);
          alert('Unable to detect your location. Please enter coordinates manually or try again.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter coordinates manually.');
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    onLocationSelect(lat, lng);
    onClose();
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setLatitude(currentLocation.lat.toString());
      setLongitude(currentLocation.lng.toString());
    }
  };

  // Common Philippines locations for quick selection
  const commonLocations = [
    { name: 'Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Quezon City', lat: 14.6760, lng: 121.0437 },
    { name: 'Makati', lat: 14.5547, lng: 121.0244 },
    { name: 'Pasig', lat: 14.5764, lng: 121.0851 },
    { name: 'Taguig', lat: 14.5176, lng: 121.0509 },
    { name: 'Antipolo', lat: 14.5932, lng: 121.1815 },
    { name: 'Bacoor', lat: 14.4599, lng: 120.9447 },
    { name: 'Imus', lat: 14.4297, lng: 120.9367 }
  ];

  const selectCommonLocation = (location: { name: string, lat: number, lng: number }) => {
    setLatitude(location.lat.toString());
    setLongitude(location.lng.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-[#4A7C59] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">📍 Select Your Location</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Location Detection */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Auto-detect Location</p>
                <p className="text-sm text-blue-700">Use your device&apos;s GPS to find your location</p>
              </div>
              <button
                onClick={detectCurrentLocation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 text-sm"
              >
                {loading ? 'Detecting...' : '📍 Detect Location'}
              </button>
            </div>
            
            {currentLocation && (
              <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
                <p className="text-sm text-green-800">
                  ✓ <strong>Current Location:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                <button
                  onClick={useCurrentLocation}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Use this location
                </button>
              </div>
            )}
          </div>

          {/* Quick Location Selection */}
          <div>
            <p className="font-medium text-gray-900 mb-3">Quick Select Common Locations</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {commonLocations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => selectCommonLocation(location)}
                  className="p-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Coordinate Input */}
          <div>
            <p className="font-medium text-gray-900 mb-3">Manual Coordinate Entry</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 14.5995"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 120.9842"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✓ <strong>Selected Location:</strong> {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                This location will be used for delivery fee calculation
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              💡 <strong>How to find your coordinates:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
              <li>Use &ldquo;Detect Location&rdquo; for automatic GPS detection</li>
              <li>Select from common Philippine cities</li>
              <li>Open Google Maps, right-click your location, and copy coordinates</li>
              <li>Use online coordinate finder tools</li>
            </ul>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))}
            className="flex-1 bg-[#4A7C59] hover:bg-[#3d6549] text-white py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
