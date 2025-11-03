/**
 * Lalamove Input Validation
 * Server-side schema validation for all Lalamove API inputs
 */

import { LalamoveConfig } from '@/config/lalamove';

export interface ValidatedStop {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  contact: {
    name: string;
    phone: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate coordinates are finite, non-zero, and within Philippines bounds
 */
function validateCoordinates(lat: number, lng: number): ValidationError | null {
  if (!isFinite(lat) || !isFinite(lng)) {
    return { field: 'coordinates', message: 'Please pin the exact location or refine the address.' };
  }

  if (lat === 0 || lng === 0) {
    return { field: 'coordinates', message: 'Please pin the exact location or refine the address.' };
  }

  const bounds = LalamoveConfig.coordinateBounds;
  if (lat < bounds.lat.min || lat > bounds.lat.max || lng < bounds.lng.min || lng > bounds.lng.max) {
    return { field: 'coordinates', message: 'Location is outside Philippines coverage area.' };
  }

  return null;
}

/**
 * Validate and normalize phone number to E.164 format (+63...)
 */
function validatePhone(phone: string): { valid: boolean; normalized?: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  let normalized = '';
  if (cleaned.startsWith('09')) {
    normalized = '+63' + cleaned.substring(1);
  } else if (cleaned.startsWith('639')) {
    normalized = '+' + cleaned;
  } else if (cleaned.startsWith('+63')) {
    normalized = cleaned;
  } else {
    return { valid: false, error: 'Phone must start with 09 or +63 (e.g., 09XX XXX XXXX).' };
  }

  if (normalized.length < 13 || normalized.length > 14) {
    return { valid: false, error: 'Invalid phone number length.' };
  }

  return { valid: true, normalized };
}

/**
 * Validate address is non-empty
 */
function validateAddress(address: string): ValidationError | null {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return { field: 'address', message: 'Address is required.' };
  }

  if (address.trim().length < 5) {
    return { field: 'address', message: 'Address is too short. Please provide a complete address.' };
  }

  return null;
}

/**
 * Validate contact name
 */
function validateContactName(name: string): ValidationError | null {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { field: 'contact.name', message: 'Contact name is required.' };
  }

  if (name.trim().length < 2) {
    return { field: 'contact.name', message: 'Contact name is too short.' };
  }

  return null;
}

/**
 * Validate service type
 */
export function validateServiceType(serviceType?: string): string {
  if (!serviceType) {
    return LalamoveConfig.serviceTypeMap.default;
  }

  const normalized = serviceType.toUpperCase();
  const validTypes = Object.values(LalamoveConfig.serviceTypeMap);

  if (validTypes.includes(normalized)) {
    return normalized;
  }

  return LalamoveConfig.serviceTypeMap.default;
}

/**
 * Validate schedule time (must be "ASAP" or future ISO timestamp)
 */
export function validateScheduleAt(scheduleAt?: string | Date): string {
  if (!scheduleAt) {
    return 'ASAP';
  }

  if (scheduleAt === 'ASAP') {
    return 'ASAP';
  }

  try {
    const scheduleDate = typeof scheduleAt === 'string' ? new Date(scheduleAt) : scheduleAt;
    const now = new Date();

    if (scheduleDate <= now) {
      return 'ASAP';
    }

    return scheduleDate.toISOString();
  } catch {
    return 'ASAP';
  }
}

/**
 * Validate a complete stop (pickup or dropoff)
 */
export function validateStop(
  stop: {
    coordinates?: { lat?: number; lng?: number };
    address?: string;
    contact?: { name?: string; phone?: string };
  },
  stopType: 'pickup' | 'dropoff'
): { valid: boolean; stop?: ValidatedStop; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!stop) {
    errors.push({ field: stopType, message: `${stopType} information is required.` });
    return { valid: false, errors };
  }

  if (!stop.coordinates || typeof stop.coordinates.lat !== 'number' || typeof stop.coordinates.lng !== 'number') {
    errors.push({ field: `${stopType}.coordinates`, message: 'Need pickup and drop-off with pinned locations.' });
    return { valid: false, errors };
  }

  const coordError = validateCoordinates(stop.coordinates.lat, stop.coordinates.lng);
  if (coordError) {
    errors.push({ field: `${stopType}.${coordError.field}`, message: coordError.message });
  }

  const addressError = validateAddress(stop.address || '');
  if (addressError) {
    errors.push({ field: `${stopType}.${addressError.field}`, message: addressError.message });
  }

  if (!stop.contact || !stop.contact.name || !stop.contact.phone) {
    errors.push({ field: `${stopType}.contact`, message: 'Contact name and phone are required.' });
  } else {
    const nameError = validateContactName(stop.contact.name);
    if (nameError) {
      errors.push({ field: `${stopType}.${nameError.field}`, message: nameError.message });
    }

    const phoneValidation = validatePhone(stop.contact.phone);
    if (!phoneValidation.valid) {
      errors.push({ field: `${stopType}.contact.phone`, message: phoneValidation.error || 'Invalid phone number.' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const phoneValidation = validatePhone(stop.contact!.phone);

  return {
    valid: true,
    stop: {
      coordinates: {
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng
      },
      address: stop.address!.trim(),
      contact: {
        name: stop.contact!.name.trim(),
        phone: phoneValidation.normalized!
      }
    },
    errors: []
  };
}

/**
 * Validate quotation request
 */
export function validateQuotationRequest(req: {
  pickup?: any;
  dropoff?: any;
  serviceType?: string;
  scheduleAt?: string | Date;
}): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const pickupValidation = validateStop(req.pickup, 'pickup');
  const dropoffValidation = validateStop(req.dropoff, 'dropoff');

  errors.push(...pickupValidation.errors, ...dropoffValidation.errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate order creation request
 */
export function validateOrderRequest(req: {
  quotationId?: string;
}): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!req.quotationId || typeof req.quotationId !== 'string' || req.quotationId.trim().length === 0) {
    errors.push({ field: 'quotationId', message: 'Valid delivery quotation is required.' });
  }

  if (req.quotationId && (req.quotationId.startsWith('FALLBACK_') || req.quotationId.startsWith('MOCK_'))) {
    errors.push({ field: 'quotationId', message: 'Invalid quotation. Please request a new delivery quote.' });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
