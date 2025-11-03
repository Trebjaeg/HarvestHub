/**
 * Lalamove API Types and DTOs
 * These match the exact structure of Lalamove v3 API for realistic integration
 */

// Address and location types
export interface NormalizedAddress {
  rawInput: string;
  lat: number;
  lng: number;
  displayName: string;
  houseNumber?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface LalamoveCoordinates {
  lat: string;
  lng: string;
}

export interface LalamoveContact {
  name: string;
  phone: string;
}

export interface LalamoveStop {
  coordinates: LalamoveCoordinates;
  address: string;
  contact?: LalamoveContact;
}

// Fee and pricing structures
export interface LalamoveFee {
  amount: string;
  currency: string;
}

export interface LalamovePriceBreakdown {
  total: LalamoveFee;
  base: LalamoveFee;
  distance: LalamoveFee;
  extraStops: LalamoveFee;
  specialRequests?: LalamoveFee;
  promo?: LalamoveFee;
}

export interface LalamoveDistance {
  value: number;
  unit: string;
}

// Quotation request and response
export interface LalamoveQuotationRequest {
  serviceType: string;
  stops: LalamoveStop[];
  isRouteOptimized: boolean;
  scheduleAt?: string | null;
  specialRequests?: string[];
  promoCode?: string | null;
  requesterContact: LalamoveContact;
  recipientContacts: LalamoveContact[];
  isCashOnDelivery: boolean;
}

export interface LalamoveQuotationResponse {
  quotationId: string;
  serviceType: string;
  priceBreakdown: LalamovePriceBreakdown;
  stops: LalamoveStop[];
  distance?: LalamoveDistance;
  scheduleAt?: string | null;
  isRouteOptimized: boolean;
  expiresAt: string;
}

// Order creation request and response
export interface LalamoveOrderRequest {
  quotationId: string;
  serviceType: string;
  stops: LalamoveStop[];
  requesterContact: LalamoveContact;
  recipientContacts: LalamoveContact[];
  isCashOnDelivery: boolean;
  remarks?: string;
  metadata?: Record<string, any>;
}

export interface LalamoveRider {
  name: string;
  phone: string;
  plateNumber: string;
  photo?: string;
  rating?: number;
}

export interface LalamoveOrderResponse {
  orderId: string;
  quotationId: string;
  status: string;
  serviceType: string;
  stops: LalamoveStop[];
  price: LalamovePriceBreakdown;
  shareLink: string;
  rider?: LalamoveRider | null;
  createdAt: string;
  scheduledAt?: string | null;
  driverAssignedAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
}

// Internal database models
export interface MockLalamoveQuotation {
  quotationId: string;
  serviceType: string;
  stops: LalamoveStop[];
  priceBreakdown: LalamovePriceBreakdown;
  distance?: LalamoveDistance;
  createdAt: Date;
  expiresAt: Date;
  isRouteOptimized: boolean;
}

export interface MockLalamoveOrder {
  lalamoveOrderId: string;
  quotationId: string;
  status: string;
  serviceType: string;
  stops: LalamoveStop[];
  price: LalamovePriceBreakdown;
  shareLink: string;
  rider?: LalamoveRider | null;
  createdAt: Date;
  scheduledAt?: Date | null;
  driverAssignedAt?: Date | null;
  pickedUpAt?: Date | null;
  completedAt?: Date | null;
  metadata?: Record<string, any>;
}

// Webhook payload structure
export interface LalamoveWebhookPayload {
  lalamoveOrderId: string;
  status: string;
  rider?: LalamoveRider;
  timestamp: string;
  location?: LalamoveCoordinates;
}

// Error response structure
export interface LalamoveErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// Service types enum
export const LALAMOVE_SERVICE_TYPES = {
  MOTORCYCLE: 'MOTORCYCLE',
  CAR: 'CAR',
  MPV: 'MPV',
  VAN: 'VAN',
  TRUCK330: 'TRUCK330'
} as const;

export type LalamoveServiceType = typeof LALAMOVE_SERVICE_TYPES[keyof typeof LALAMOVE_SERVICE_TYPES];

// Special requests enum
export const LALAMOVE_SPECIAL_REQUESTS = {
  HELP_BUY: 'HELP_BUY',
  HELP_DELIVER: 'HELP_DELIVER',
  FRAGILE: 'FRAGILE',
  DOCUMENTS: 'DOCUMENTS'
} as const;

export type LalamoveSpecialRequest = typeof LALAMOVE_SPECIAL_REQUESTS[keyof typeof LALAMOVE_SPECIAL_REQUESTS];