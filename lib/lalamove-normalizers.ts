/**
 * Input Normalizers for Lalamove V3
 * Validates and normalizes data BEFORE calling Lalamove API
 * Prevents bad requests and provides clear error messages
 */

import { LalamoveConfig } from '@/config/lalamove';

export interface NormalizedAddress {
  address: string;
  lat: string;
  lng: string;
}

export interface NormalizedContact {
  name: string;
  phone: string;
}

/**
 * Normalize address string - ensure non-empty and properly formatted
 */
export function normalizeAddress(address?: string): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Address is required and must be a valid string');
  }
  
  const trimmed = address.trim();
  
  if (trimmed.length < 10) {
    throw new Error('Address is too short. Please provide a complete address (street, city, province)');
  }
  
  // Ensure it's a full address with multiple parts
  if (!trimmed.includes(',') && trimmed.split(' ').length < 3) {
    throw new Error('Please provide a complete address including street, city, and province');
  }
  
  return trimmed;
}

/**
 * Normalize coordinates - convert to strings and validate ranges
 */
export function normalizeCoords(lat?: number | string, lng?: number | string): { lat: string; lng: string } {
  // Convert to numbers
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  // Validate existence
  if (latNum === undefined || lngNum === undefined || isNaN(latNum) || isNaN(lngNum)) {
    throw new Error('Invalid coordinates. Please select a location on the map');
  }
  
  // Validate within Philippines bounds
  const { lat: latBounds, lng: lngBounds } = LalamoveConfig.coordinateBounds;
  
  if (latNum < latBounds.min || latNum > latBounds.max) {
    throw new Error(`Latitude ${latNum} is outside Philippines. Please select a location within the Philippines`);
  }
  
  if (lngNum < lngBounds.min || lngNum > lngBounds.max) {
    throw new Error(`Longitude ${lngNum} is outside Philippines. Please select a location within the Philippines`);
  }
  
  // Return as strings with proper precision (6 decimals)
  return {
    lat: latNum.toFixed(6),
    lng: lngNum.toFixed(6)
  };
}

/**
 * Normalize phone number to E.164 format for Philippines
 */
export function normalizePhone(phone?: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required');
  }
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Must have at least 10 digits
  if (cleaned.length < 10) {
    throw new Error('Phone number is too short. Please provide a valid Philippine mobile number');
  }
  
  // If starts with 0, replace with 63
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.substring(1);
  }
  
  // If doesn't start with 63, prepend it
  if (!cleaned.startsWith('63')) {
    cleaned = '63' + cleaned;
  }
  
  // Validate length (should be 12 digits: 63 + 10 digits)
  if (cleaned.length !== 12) {
    throw new Error('Invalid Philippine phone number format. Expected format: 09XX XXX XXXX');
  }
  
  // Add + prefix for E.164
  return '+' + cleaned;
}

/**
 * Normalize contact info (name + phone)
 */
export function normalizeContact(contact?: { name?: string; phone?: string }): NormalizedContact {
  if (!contact) {
    throw new Error('Contact information is required');
  }
  
  const name = contact.name?.trim();
  if (!name || name.length < 2) {
    throw new Error('Contact name must be at least 2 characters');
  }
  
  const phone = normalizePhone(contact.phone);
  
  return { name, phone };
}

/**
 * Normalize location (address + coordinates)
 */
export function normalizeLocation(location?: {
  address?: string;
  lat?: number | string;
  lng?: number | string;
}): NormalizedAddress {
  if (!location) {
    throw new Error('Location information is required');
  }
  
  const address = normalizeAddress(location.address);
  const coords = normalizeCoords(location.lat, location.lng);
  
  return {
    address,
    lat: coords.lat,
    lng: coords.lng
  };
}

/**
 * Validate minimum number of stops (pickup + at least 1 dropoff)
 */
export function validateStopsCount(stops: any[]): void {
  if (!Array.isArray(stops) || stops.length < LalamoveConfig.minStops) {
    throw new Error(
      `Need at least ${LalamoveConfig.minStops} stops: 1 pickup location + 1 delivery location with pinned coordinates`
    );
  }
}

/**
 * Pre-validation - run ALL validations before calling API
 * Returns clear, actionable error messages
 */
export function validateQuotationInputs(input: {
  pickupLocation?: any;
  pickupContact?: any;
  dropoffLocation?: any;
  dropoffContact?: any;
  serviceType?: string;
}): {
  pickup: { location: NormalizedAddress; contact: NormalizedContact };
  dropoff: { location: NormalizedAddress; contact: NormalizedContact };
  serviceType: string;
} {
  try {
    // Validate pickup
    const pickupLocation = normalizeLocation(input.pickupLocation);
    const pickupContact = normalizeContact(input.pickupContact);
    
    // Validate dropoff
    const dropoffLocation = normalizeLocation(input.dropoffLocation);
    const dropoffContact = normalizeContact(input.dropoffContact);
    
    // Validate service type
    const serviceType = input.serviceType?.toUpperCase() || 'MOTORCYCLE';
    const validTypes = ['MOTORCYCLE', 'SEDAN', 'MPV', 'VAN'];
    if (!validTypes.includes(serviceType)) {
      throw new Error(`Invalid vehicle type "${input.serviceType}". Choose: Motorcycle, Sedan, MPV, or Van`);
    }
    
    return {
      pickup: { location: pickupLocation, contact: pickupContact },
      dropoff: { location: dropoffLocation, contact: dropoffContact },
      serviceType
    };
  } catch (error: any) {
    // Re-throw with context about which field failed
    throw new Error(error.message || 'Invalid input data');
  }
}
