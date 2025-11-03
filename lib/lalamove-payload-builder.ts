/**
 * Lalamove V3 Payload Builder
 * Centralized payload builder for quotation and order endpoints
 */

import { LalamoveConfig } from '@/config/lalamove';
import { validateServiceType, validateScheduleAt, ValidatedStop } from './lalamove-validation';

export interface LalamoveV3QuotationPayload {
  data: {
    serviceType: string;
    scheduleAt: string;
    stops: Array<{
      coordinates: {
        lat: number;  // Changed from string to number
        lng: number;  // Changed from string to number
      };
      address: string;
    }>;
    specialRequests: string[];
  };
}

export interface LalamoveV3OrderPayload {
  data: {
    quotationId: string;
    sender: {
      stopId: string;
      name: string;
      phone: string;
    };
    recipients: Array<{
      stopId: string;
      name: string;
      phone: string;
    }>;
  };
}

/**
 * Build quotation payload wrapped in {data: {...}}
 */
export function buildV3QuotationPayload(params: {
  pickup: ValidatedStop;
  dropoff: ValidatedStop;
  serviceType?: string;
  scheduleAt?: string | Date;
}): LalamoveV3QuotationPayload {
  const serviceType = validateServiceType(params.serviceType);
  const scheduleAt = validateScheduleAt(params.scheduleAt);

  return {
    data: {
      serviceType,
      scheduleAt,
      stops: [
        {
          coordinates: {
            lat: parseFloat(params.pickup.coordinates.lat.toFixed(6)),  // Convert to number
            lng: parseFloat(params.pickup.coordinates.lng.toFixed(6))   // Convert to number
          },
          address: params.pickup.address
        },
        {
          coordinates: {
            lat: parseFloat(params.dropoff.coordinates.lat.toFixed(6)), // Convert to number
            lng: parseFloat(params.dropoff.coordinates.lng.toFixed(6))  // Convert to number
          },
          address: params.dropoff.address
        }
      ],
      specialRequests: []
    }
  };
}

/**
 * Build order payload wrapped in {data: {...}}
 */
export function buildV3OrderPayload(params: {
  quotationId: string;
  pickup: ValidatedStop;
  dropoff: ValidatedStop;
}): LalamoveV3OrderPayload {
  return {
    data: {
      quotationId: params.quotationId,
      sender: {
        stopId: '0',
        name: params.pickup.contact.name,
        phone: params.pickup.contact.phone
      },
      recipients: [
        {
          stopId: '1',
          name: params.dropoff.contact.name,
          phone: params.dropoff.contact.phone
        }
      ]
    }
  };
}

/**
 * Legacy payload builders for backward compatibility
 */
export interface LalamoveStop {
  location: {
    lat: string;
    lng: string;
  };
  addresses: {
    en_PH: string;
  };
}

export interface LalamoveQuotationPayload {
  serviceType: string;
  stops: LalamoveStop[];
  scheduleAt?: string;
}

export interface LalamoveOrderPayload {
  quotationId: string;
  sender: {
    stopId: string;
    contact: {
      name: string;
      phone: string;
    };
    remarks?: string;
  };
  recipients: Array<{
    stopId: string;
    contact: {
      name: string;
      phone: string;
    };
    remarks?: string;
  }>;
  metadata?: {
    orderRef?: string;
  };
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('09')) {
    return '+63' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('639')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('+63')) {
    return cleaned;
  }
  
  return '+63' + cleaned;
}

export function buildQuotationPayload(params: {
  pickupLocation: { lat?: string | number; lng?: string | number; address?: string };
  pickupContact: { name?: string; phone?: string };
  dropoffLocation: { lat?: string | number; lng?: string | number; address?: string };
  dropoffContact: { name?: string; phone?: string };
  serviceType?: string;
  scheduleAt?: string | Date;
}): LalamoveQuotationPayload {
  const pickupLat = typeof params.pickupLocation.lat === 'number' 
    ? params.pickupLocation.lat.toFixed(6)
    : String(params.pickupLocation.lat || '0');
    
  const pickupLng = typeof params.pickupLocation.lng === 'number'
    ? params.pickupLocation.lng.toFixed(6)
    : String(params.pickupLocation.lng || '0');
    
  const dropoffLat = typeof params.dropoffLocation.lat === 'number'
    ? params.dropoffLocation.lat.toFixed(6)
    : String(params.dropoffLocation.lat || '0');
    
  const dropoffLng = typeof params.dropoffLocation.lng === 'number'
    ? params.dropoffLocation.lng.toFixed(6)
    : String(params.dropoffLocation.lng || '0');

  const stops: LalamoveStop[] = [
    {
      location: {
        lat: pickupLat,
        lng: pickupLng
      },
      addresses: {
        en_PH: params.pickupLocation.address || 'Manila, Metro Manila, Philippines'
      }
    },
    {
      location: {
        lat: dropoffLat,
        lng: dropoffLng
      },
      addresses: {
        en_PH: params.dropoffLocation.address || 'Quezon City, Metro Manila, Philippines'
      }
    }
  ];

  const payload: LalamoveQuotationPayload = {
    serviceType: params.serviceType || 'MOTORCYCLE',
    stops
  };

  if (params.scheduleAt) {
    const scheduleDate = typeof params.scheduleAt === 'string' 
      ? new Date(params.scheduleAt) 
      : params.scheduleAt;
    payload.scheduleAt = scheduleDate.toISOString();
  }

  return payload;
}

export function buildOrderPayload(params: {
  quotationId: string;
  pickupContact: { name: string; phone: string };
  dropoffContact: { name: string; phone: string };
  pickupRemarks?: string;
  dropoffRemarks?: string;
  orderRef?: string;
}): LalamoveOrderPayload {
  if (!params.quotationId || typeof params.quotationId !== 'string') {
    throw new Error('Valid quotation ID is required to create an order');
  }

  const senderPhone = normalizePhone(params.pickupContact.phone);
  const recipientPhone = normalizePhone(params.dropoffContact.phone);

  const payload: LalamoveOrderPayload = {
    quotationId: params.quotationId,
    sender: {
      stopId: '0',
      contact: {
        name: params.pickupContact.name,
        phone: senderPhone
      }
    },
    recipients: [
      {
        stopId: '1',
        contact: {
          name: params.dropoffContact.name,
          phone: recipientPhone
        }
      }
    ]
  };

  if (params.pickupRemarks) {
    payload.sender.remarks = params.pickupRemarks;
  }

  if (params.dropoffRemarks) {
    payload.recipients[0].remarks = params.dropoffRemarks;
  }

  if (params.orderRef) {
    payload.metadata = { orderRef: params.orderRef };
  }

  return payload;
}
