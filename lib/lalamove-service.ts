import crypto from 'crypto';
import { LalamoveConfig } from '@/config/lalamove';
import { buildQuotationPayload, buildOrderPayload } from './lalamove-payload-builder';
import { extractUserMessage, isRetryableError } from './lalamove-error-mapper';

const LALAMOVE_API_URL = LalamoveConfig.baseUrl;
const LALAMOVE_API_KEY = LalamoveConfig.apiKey;
const LALAMOVE_API_SECRET = LalamoveConfig.secretKey;
const LALAMOVE_MARKET = LalamoveConfig.market;

interface LalamoveCoordinates {
  lat: number;
  lng: number;
}

interface LalamoveLocation {
  coordinates: LalamoveCoordinates;
  address: string;
}

interface LalamoveContact {
  name: string;
  phone: string;
}

interface LalamoveStop {
  location: {
    lat: string;
    lng: string;
  };
  addresses: {
    en_PH: string;
  };
}

interface QuotationRequest {
  serviceType: string;
  stops: LalamoveStop[];
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

function generateSignature(timestamp: string, method: string, path: string, body?: unknown): string {
  let bodyString = '';
  if (body) {
    const sortedBody = sortObject(body);
    bodyString = JSON.stringify(sortedBody);
  }
  
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${bodyString}`;
  
  return crypto
    .createHmac('sha256', LALAMOVE_API_SECRET)
    .update(rawSignature)
    .digest('hex');
}

function sortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => sortObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = sortObject(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

async function lalamoveRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  timeout: number = 5000,
  retryCount: number = 0
): Promise<T> {
  if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
    throw new Error('Lalamove API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const signature = generateSignature(timestamp, method, path, body);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
    'Market': LALAMOVE_MARKET,
  };

  const url = `${LALAMOVE_API_URL}${path}`;
  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const sortedBody = sortObject(body);
    options.body = JSON.stringify(sortedBody);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const userMessage = extractUserMessage(data, response.status);
      
      if (isRetryableError(response.status) && retryCount < LalamoveConfig.retry.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, LalamoveConfig.retry.backoffMs));
        return lalamoveRequest<T>(method, path, body, timeout, retryCount + 1);
      }
      
      const error: any = new Error(userMessage);
      error.statusCode = response.status;
      error.lalamoveError = data;
      throw error;
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' && retryCount < LalamoveConfig.retry.maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, LalamoveConfig.retry.backoffMs));
      return lalamoveRequest<T>(method, path, body, timeout, retryCount + 1);
    }

    if (error.statusCode) {
      throw error;
    }

    throw new Error('Network error connecting to delivery service. Please try again.');
  }
}

export async function createQuotation(
  pickupLocation: { lat: string; lng: string; address: string },
  pickupContact: { name: string; phone: string },
  dropoffLocation: { lat: string; lng: string; address: string },
  dropoffContact: { name: string; phone: string },
  serviceType: string = 'MOTORCYCLE',
  scheduleAt?: Date
): Promise<QuotationResponse> {
  
  const payload = buildQuotationPayload({
    pickupLocation,
    pickupContact,
    dropoffLocation,
    dropoffContact,
    serviceType,
    scheduleAt
  });

  return lalamoveRequest<QuotationResponse>('POST', '/v3/quotations', payload, LalamoveConfig.timeouts.quotation);
}

export async function createOrder(
  quotationId: string,
  pickupContact: LalamoveContact,
  dropoffContact: LalamoveContact,
  pickupRemarks?: string,
  dropoffRemarks?: string,
  orderRef?: string
): Promise<OrderResponse> {
  
  const payload = buildOrderPayload({
    quotationId,
    pickupContact,
    dropoffContact,
    pickupRemarks,
    dropoffRemarks,
    orderRef
  });

  return lalamoveRequest<OrderResponse>('POST', '/v3/orders', payload, LalamoveConfig.timeouts.order);
}

export async function getOrderDetails(orderId: string): Promise<OrderResponse> {
  return lalamoveRequest<OrderResponse>('GET', `/v3/orders/${orderId}`, undefined, 5000);
}

export async function cancelOrder(orderId: string): Promise<void> {
  await lalamoveRequest<void>('DELETE', `/v3/orders/${orderId}`, undefined, 5000);
}

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
