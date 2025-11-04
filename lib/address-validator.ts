/**
 * Production-Ready Address Validator for Lalamove Integration
 * Ensures all addresses meet both LocationIQ and Lalamove requirements
 */

// Philippines geographic bounds for validation
const PHILIPPINES_BOUNDS = {
  lat: { min: 4.0, max: 21.0 },
  lng: { min: 116.0, max: 127.0 }
};

export interface ValidatedAddress {
  street: string;
  city: string;
  province: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  isComplete: boolean;
  warnings: string[];
}

export interface LocationIQAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  city?: string;
  municipality?: string;
  town?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

/**
 * Validates coordinates are within Philippines bounds
 */
export function validateCoordinates(lat: number, lng: number): { valid: boolean; error?: string } {
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Invalid coordinates format' };
  }

  if (lat < PHILIPPINES_BOUNDS.lat.min || lat > PHILIPPINES_BOUNDS.lat.max) {
    return { valid: false, error: 'Latitude outside Philippines bounds (4°N to 21°N)' };
  }

  if (lng < PHILIPPINES_BOUNDS.lng.min || lng > PHILIPPINES_BOUNDS.lng.max) {
    return { valid: false, error: 'Longitude outside Philippines bounds (116°E to 127°E)' };
  }

  return { valid: true };
}

/**
 * Extracts city from LocationIQ address with multiple fallbacks
 */
function extractCity(address: LocationIQAddress): string {
  return (
    address.city ||
    address.municipality ||
    address.town ||
    address.state_district ||
    ''
  );
}

/**
 * Extracts street from LocationIQ address with fallbacks
 */
function extractStreet(address: LocationIQAddress): string {
  // Priority: road > suburb > neighbourhood > village > city
  const street = 
    address.road ||
    address.suburb ||
    address.neighbourhood ||
    address.village ||
    '';

  // If still empty, use city as last resort
  if (!street) {
    const city = extractCity(address);
    return city || 'Address';
  }

  return street;
}

/**
 * Validates and normalizes LocationIQ response for Lalamove
 */
export function validateAndNormalizeAddress(
  locationIQData: {
    lat: string | number;
    lon: string | number;
    display_name: string;
    address: LocationIQAddress;
  }
): ValidatedAddress {
  const warnings: string[] = [];
  
  // Parse coordinates as numbers (CRITICAL for Lalamove)
  const latitude = typeof locationIQData.lat === 'string' 
    ? parseFloat(locationIQData.lat) 
    : locationIQData.lat;
  
  const longitude = typeof locationIQData.lon === 'string'
    ? parseFloat(locationIQData.lon)
    : locationIQData.lon;

  // Validate coordinates
  const coordValidation = validateCoordinates(latitude, longitude);
  if (!coordValidation.valid) {
    warnings.push(coordValidation.error!);
  }

  const address = locationIQData.address;

  // Extract fields with fallbacks
  let street = extractStreet(address);
  let city = extractCity(address);
  let province = address.state || '';
  const zipCode = address.postcode || '';

  // Validate required fields for Lalamove
  let isComplete = true;

  if (!street || street.length < 3) {
    warnings.push('Street address is too short or missing');
    isComplete = false;
    // Use display_name as fallback
    street = locationIQData.display_name.split(',')[0] || 'Unknown Street';
  }

  if (!city || city.length < 3) {
    warnings.push('City/Municipality is missing');
    isComplete = false;
    // Default to Manila for Metro Manila coordinates
    if (latitude >= 14.4 && latitude <= 14.8 && longitude >= 120.9 && longitude <= 121.2) {
      city = 'Manila';
      warnings.push('Defaulted to Manila based on coordinates');
    } else {
      city = 'Unknown City';
    }
  }

  if (!province || province.length < 3) {
    warnings.push('Province is missing');
    isComplete = false;
    // Default to Metro Manila for Metro Manila coordinates
    if (latitude >= 14.4 && latitude <= 14.8 && longitude >= 120.9 && longitude <= 121.2) {
      province = 'Metro Manila';
      warnings.push('Defaulted to Metro Manila based on coordinates');
    } else if (latitude >= 14.8 && latitude <= 15.0 && longitude >= 120.8 && longitude <= 121.2) {
      province = 'Bulacan';
      warnings.push('Defaulted to Bulacan based on coordinates');
    } else {
      province = 'Unknown Province';
    }
  }

  // Build formatted address for Lalamove (must be complete)
  const formattedAddress = `${street}, ${city}, ${province}${zipCode ? ` ${zipCode}` : ''}, Philippines`;

  return {
    street: street.trim(),
    city: city.trim(),
    province: province.trim(),
    zipCode: zipCode.trim(),
    latitude,
    longitude,
    formattedAddress,
    isComplete,
    warnings
  };
}

/**
 * Validates phone number for Lalamove (E.164 format required)
 */
export function validateAndNormalizePhone(phone: string): { 
  phone: string; 
  valid: boolean; 
  error?: string 
} {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Must have at least 10 digits
  if (cleaned.length < 10) {
    return {
      phone: phone,
      valid: false,
      error: 'Phone number must have at least 10 digits'
    };
  }

  // Convert to E.164 format (+63XXXXXXXXXX)
  let normalized = '';

  if (cleaned.startsWith('63')) {
    // Already has country code
    normalized = '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add +63
    normalized = '+63' + cleaned.substring(1);
  } else {
    // Add +63 prefix
    normalized = '+63' + cleaned;
  }

  // Validate final format (must be exactly 13 characters: +63XXXXXXXXXX)
  if (normalized.length !== 13) {
    return {
      phone: normalized,
      valid: false,
      error: `Invalid phone number length (expected 13 characters, got ${normalized.length})`
    };
  }

  return {
    phone: normalized,
    valid: true
  };
}

/**
 * Creates a Lalamove-compatible address object
 */
export function createLalamoveAddress(validated: ValidatedAddress, contactName: string, contactPhone: string) {
  const phoneValidation = validateAndNormalizePhone(contactPhone);
  
  if (!phoneValidation.valid) {
    throw new Error(phoneValidation.error || 'Invalid phone number');
  }

  if (!validated.isComplete) {
    throw new Error(`Incomplete address data: ${validated.warnings.join(', ')}`);
  }

  return {
    coordinates: {
      lat: validated.latitude,  // NUMBER not string!
      lng: validated.longitude  // NUMBER not string!
    },
    address: validated.formattedAddress,
    contact: {
      name: contactName,
      phone: phoneValidation.phone
    }
  };
}
