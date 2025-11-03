"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface InteractiveLocationMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function InteractiveLocationMap({
  initialLat = 14.5995,
  initialLng = 120.9842,
  onLocationSelect
}: InteractiveLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only initialize map on client side
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (mapRef.current) return; // Prevent re-initialization

    try {
      // Create map instance with explicit options
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
      });

      // Add LocationIQ tile layer - CORRECT URL FORMAT
      const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY || 'pk.f2f94cd4c3c21570dae13f1ce749b472';
      
      const tileLayer = L.tileLayer(
        `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${apiKey}`,
        {
          attribution: '&copy; <a href="https://locationiq.com">LocationIQ</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      );

      tileLayer.on('load', () => {
        setIsLoading(false);
      });

      tileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
      });

      tileLayer.addTo(map);

      // Add draggable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        autoPan: true,
      }).addTo(map);

      marker.bindPopup('<div style="text-align: center;"><b>📍 Your Location</b><br><small>Click anywhere on map<br>or drag this marker!</small></div>').openPopup();

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setSelectedCoords({ lat: position.lat, lng: position.lng });
        onLocationSelect(position.lat, position.lng);
        marker.bindPopup(`<div style="text-align: center;"><b>✓ Location Selected</b><br><small>Lat: ${position.lat.toFixed(6)}<br>Lng: ${position.lng.toFixed(6)}</small></div>`).openPopup();
      });

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        map.panTo([lat, lng]);
        setSelectedCoords({ lat, lng });
        onLocationSelect(lat, lng);
        marker.bindPopup(`<div style="text-align: center;"><b>✓ Location Selected</b><br><small>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</small></div>`).openPopup();
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Force map to render properly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when initialLat/initialLng changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && (initialLat !== 14.5995 || initialLng !== 120.9842)) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapRef.current.setView([initialLat, initialLng], 15);
    }
  }, [initialLat, initialLng]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading LocationIQ Map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[500px] rounded-lg border-2 border-gray-300 z-0"
        style={{ minHeight: '500px' }}
      />
      {selectedCoords && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border-2 border-green-500 rounded-lg p-3 shadow-lg z-10">
          <p className="text-sm text-gray-700 font-medium">
            <span className="text-green-600">✓ Selected:</span> {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Click "Confirm Location" below to get the address</p>
        </div>
      )}
    </div>
  );
}
