/**
 * Input normalizers for Lalamove API
 * Validates and normalizes data before sending to Lalamove
 */

/**
 * Normalize address to ensure non-empty formatted string
 */
export function normalizeAddress(address: string | undefined): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Address is required and must be a string');
  }
  
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    throw new Error('Address must be at least 10 characters long');
  }
  
  return trimmed;
}

/**
 * Normalize coordinates to floats within valid ranges
 */
export function normalizeCoords(lat: string | number, lng: string | number): { lat: string; lng: string } {
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    throw new Error('Coordinates must be valid numbers');
  }
  
  // Philippines bounds: lat 4-21, lng 116-127
  if (latNum < 4 || latNum > 21 || lngNum < 116 || lngNum > 127) {
    throw new Error('Coordinates are outside Philippines bounds');
  }
  
  // Return as strings (Lalamove v3 expects strings)
  return {
    lat: latNum.toFixed(6),
    lng: lngNum.toFixed(6)
  };
}

/**
 * Normalize phone number to E.164 format (+63XXXXXXXXXX)
 */
export function normalizePhone(phone: string | undefined): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required');
  }
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 63
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.substring(1);
  }
  
  // If doesn't start with 63, prepend it
  if (!cleaned.startsWith('63')) {
    cleaned = '63' + cleaned;
  }
  
  // Validate length (63 + 10 digits = 12 total)
  if (cleaned.length !== 12) {
    throw new Error('Invalid Philippine phone number format');
  }
  
  // Add + prefix for E.164
  return '+' + cleaned;
}

/**
 * Validate stops array has at least 2 stops (pickup + dropoff)
 */
export function validateStops(stops: any[]): void {
  if (!Array.isArray(stops)) {
    throw new Error('Stops must be an array');
  }
  
  if (stops.length < 2) {
    throw new Error('Need pickup + at least one drop-off with pinned locations');
  }
  
  // Validate each stop has required fields
  stops.forEach((stop, index) => {
    const stopType = index === 0 ? 'Pickup' : 'Drop-off';
    
    if (!stop.location || !stop.location.lat || !stop.location.lng) {
      throw new Error(`${stopType} location coordinates are required`);
    }
    
    if (!stop.addresses || !stop.addresses.en_PH) {
      throw new Error(`${stopType} address is required`);
    }
  });
}
