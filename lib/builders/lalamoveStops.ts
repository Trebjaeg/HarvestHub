/**
 * Lalamove V3 Stops Builder
 * Builds validated quotation payload with geocoded coordinates
 */

import { geocodeFromCityProvince, GeocodedLocation } from '@/services/geocode/locationiq';

/**
 * Normalize phone number to +63 format
 */
function normalizePhone(phone: string): string {
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 09, convert to +639
  if (cleaned.startsWith('09')) {
    return '+63' + cleaned.substring(1);
  }
  
  // If starts with 639, add +
  if (cleaned.startsWith('639')) {
    return '+' + cleaned;
  }
  
  // If already starts with +63, return as is
  if (cleaned.startsWith('+63')) {
    return cleaned;
  }
  
  // Default: assume it's Philippine number and add +63
  return '+63' + cleaned;
}

/**
 * Map service type (future expansion for vehicle types)
 */
function mapServiceType(vehicle?: string): string {
  const mapping: Record<string, string> = {
    'MOTORCYCLE': 'MOTORCYCLE',
    'SEDAN': 'SEDAN',
    'MPV': 'MPV',
    'VAN': 'VAN'
  };
  
  return mapping[vehicle?.toUpperCase() || 'MOTORCYCLE'] || 'MOTORCYCLE';
}

/**
 * Extract city and province from address string
 * Handles both formats:
 * - "City, Province, Philippines" (seller address)
 * - "Street, City, Province, Philippines" (buyer address)
 */
function extractCityProvince(address: string): { city: string; province: string; street?: string } {
  // Remove "Philippines" suffix and split by comma
  const cleanAddress = address.replace(/, Philippines$/i, '').trim();
  const parts = cleanAddress.split(',').map(p => p.trim());
  
  if (parts.length === 3) {
    // Format: "Street, City, Province"
    return {
      street: parts[0],
      city: parts[1],
      province: parts[2]
    };
  }
  
  if (parts.length === 2) {
    // Format: "City, Province"
    return {
      city: parts[0],
      province: parts[1]
    };
  }
  
  if (parts.length === 1) {
    // Format: "City" only - assume Metro Manila
    return {
      city: parts[0],
      province: 'Metro Manila'
    };
  }
  
  // Fallback
  return {
    city: 'Manila',
    province: 'Metro Manila'
  };
}

/**
 * Build Lalamove V3 quotation payload
 * Uses REVERSE GEOCODING for reliable coordinate + address formatting
 */
export async function buildLalamoveQuotationPayload(order: any) {
  const store = order.store;
  const buyer = order.buyer;

  // NEW: Handle separated fields (street, city, province) instead of concatenated address
  const storeCity = store.city || 'Manila';
  const storeProvince = store.province || 'Metro Manila';
  const storeStreet = store.street || '';

  const buyerCity = buyer.city;
  const buyerProvince = buyer.province;
  const buyerStreet = buyer.street || '';

  // Get coordinates + formatted address using REVERSE GEOCODING
  const [storeLoc, buyerLoc] = await Promise.all([
    geocodeFromCityProvince(storeCity, storeProvince, storeStreet),
    geocodeFromCityProvince(buyerCity, buyerProvince, buyerStreet)
  ]);

  // Validate both stops have valid coordinates
  if (!storeLoc?.lat || !storeLoc?.lng || !buyerLoc?.lat || !buyerLoc?.lng) {
    throw new Error('INVALID_STOPS');
  }

  // Build Lalamove V3 quotation payload
  return {
    serviceType: mapServiceType(order.vehicle),
    stops: [
      {
        location: {
          lat: storeLoc.lat.toFixed(6),
          lng: storeLoc.lng.toFixed(6)
        },
        addresses: {
          en_PH: storeLoc.formattedAddress
        }
      },
      {
        location: {
          lat: buyerLoc.lat.toFixed(6),
          lng: buyerLoc.lng.toFixed(6)
        },
        addresses: {
          en_PH: buyerLoc.formattedAddress
        }
      }
    ]
  };
}

/**
 * Build Lalamove V3 order payload (for actual order placement)
 */
export function buildLalamoveOrderPayload(params: {
  quotationId: string;
  pickupContact: { name: string; phone: string };
  dropoffContact: { name: string; phone: string };
  pickupRemarks?: string;
  dropoffRemarks?: string;
  orderRef?: string;
}) {
  if (!params.quotationId || typeof params.quotationId !== 'string') {
    throw new Error('Valid quotation ID is required to create an order');
  }

  return {
    quotationId: params.quotationId,
    sender: {
      stopId: '0',
      contact: {
        name: params.pickupContact.name,
        phone: normalizePhone(params.pickupContact.phone)
      },
      remarks: params.pickupRemarks
    },
    recipients: [
      {
        stopId: '1',
        contact: {
          name: params.dropoffContact.name,
          phone: normalizePhone(params.dropoffContact.phone)
        },
        remarks: params.dropoffRemarks
      }
    ],
    metadata: params.orderRef ? { orderRef: params.orderRef } : undefined
  };
}
