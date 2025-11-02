import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const LALAMOVE_API_URL = process.env.LALAMOVE_API_URL || 'https://rest.sandbox.lalamove.com';
const LALAMOVE_API_KEY = process.env.LALAMOVE_API_KEY || '';
const LALAMOVE_API_SECRET = process.env.LALAMOVE_API_SECRET || '';
const LALAMOVE_MARKET = 'PH';

interface LalamoveLocation {
  lat: string;
  lng: string;
  address: string;
}

interface LalamoveContact {
  name: string;
  phone: string;
}

interface LalamoveStop {
  stopId: string;
  location: LalamoveLocation;
  contact: LalamoveContact;
  remarks?: string;
}

interface QuotationRequest {
  serviceType: string;
  stops: LalamoveStop[];
  scheduleAt?: string;
}

interface QuotationResponse {
  quotationId: string;
  priceBreakdown: {
    base: number;
    total: number;
    currency: string;
  };
  expiresAt: string;
  distance?: {
    value: number;
    unit: string;
  };
}

interface CreateOrderRequest {
  quotationId: string;
  sender: {
    stopId: string;
    contact: LalamoveContact;
    remarks?: string;
  };
  recipients: Array<{
    stopId: string;
    contact: LalamoveContact;
    remarks?: string;
  }>;
  metadata?: {
    orderRef?: string;
  };
}

interface OrderResponse {
  orderId: string;
  status: string;
  driverId?: string;
  shareLink?: string;
  distance?: {
    value: number;
    unit: string;
  };
  price?: {
    amount: number;
    currency: string;
  };
}

/**
 * Generate HMAC-SHA256 signature for Lalamove API
 */
function generateSignature(timestamp: string, method: string, path: string, body?: unknown): string {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n`;
  const bodyString = body ? JSON.stringify(body) : '';
  const message = rawSignature + bodyString;
  
  return crypto
    .createHmac('sha256', LALAMOVE_API_SECRET)
    .update(message)
    .digest('hex');
}

/**
 * Make authenticated request to Lalamove API
 */
async function lalamoveRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const timestamp = Date.now().toString();
  const signature = generateSignature(timestamp, method, path, body);
  const requestId = uuidv4();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
    'Market': LALAMOVE_MARKET,
    'Request-ID': requestId,
  };

  const url = `${LALAMOVE_API_URL}${path}`;
  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Lalamove API error: ${response.status} - ${JSON.stringify(data)}`
    );
  }

  return data as T;
}

/**
 * Create a delivery quotation
 */
export async function createQuotation(
  pickupLocation: LalamoveLocation,
  pickupContact: LalamoveContact,
  dropoffLocation: LalamoveLocation,
  dropoffContact: LalamoveContact,
  serviceType: string = 'MOTORCYCLE',
  scheduleAt?: Date
): Promise<QuotationResponse> {
  const request: QuotationRequest = {
    serviceType,
    stops: [
      {
        stopId: '1',
        location: pickupLocation,
        contact: pickupContact,
      },
      {
        stopId: '2',
        location: dropoffLocation,
        contact: dropoffContact,
      },
    ],
  };

  if (scheduleAt) {
    request.scheduleAt = scheduleAt.toISOString();
  }

  return lalamoveRequest<QuotationResponse>('POST', '/v3/quotations', request as unknown);
}

/**
 * Create a delivery order
 */
export async function createOrder(
  quotationId: string,
  pickupContact: LalamoveContact,
  dropoffContact: LalamoveContact,
  pickupRemarks?: string,
  dropoffRemarks?: string,
  orderRef?: string
): Promise<OrderResponse> {
  const request: CreateOrderRequest = {
    quotationId,
    sender: {
      stopId: '1',
      contact: pickupContact,
      remarks: pickupRemarks,
    },
    recipients: [
      {
        stopId: '2',
        contact: dropoffContact,
        remarks: dropoffRemarks,
      },
    ],
  };

  if (orderRef) {
    request.metadata = { orderRef };
  }

  return lalamoveRequest<OrderResponse>('POST', '/v3/orders', request as unknown);
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string): Promise<OrderResponse> {
  return lalamoveRequest<OrderResponse>('GET', `/v3/orders/${orderId}`);
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  await lalamoveRequest<void>('DELETE', `/v3/orders/${orderId}`);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  receivedSignature: string,
  timestamp: string
): boolean {
  const message = `${timestamp}\r\n${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', LALAMOVE_API_SECRET)
    .update(message)
    .digest('hex');
  
  return expectedSignature === receivedSignature;
}

const lalamoveService = {
  createQuotation,
  createOrder,
  getOrderDetails,
  cancelOrder,
  verifyWebhookSignature,
};

export default lalamoveService;
