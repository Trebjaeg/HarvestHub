import { NextRequest, NextResponse } from 'next/server';
import { LalamoveConfig, isSimulatorMode, mapServiceType } from '@/config/lalamove';
import { mockLalamoveService } from '@/services/mock-lalamove';
import crypto from 'crypto';

// Legacy imports for live mode
import { validateStop } from '@/lib/lalamove-validation';
import { buildV3QuotationPayload } from '@/lib/lalamove-payload-builder';
import { createErrorResponse, isRetryableError } from '@/lib/lalamove-error-mapper';

const LALAMOVE_API_URL = LalamoveConfig.baseUrl;
const LALAMOVE_API_KEY = LalamoveConfig.apiKey;
const LALAMOVE_API_SECRET = LalamoveConfig.secretKey;
const LALAMOVE_MARKET = LalamoveConfig.market;

// Manual address to coordinates mapping for major Philippine cities
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Metro Manila
  'Manila': { lat: 14.5995, lng: 120.9842 },
  'Quezon City': { lat: 14.6760, lng: 121.0437 },
  'Makati': { lat: 14.5547, lng: 121.0244 },
  'Pasig': { lat: 14.5764, lng: 121.0851 },
  'Taguig': { lat: 14.5176, lng: 121.0509 },
  'Mandaluyong': { lat: 14.5794, lng: 121.0359 },
  'Pasay': { lat: 14.5378, lng: 120.9896 },
  'Caloocan': { lat: 14.6488, lng: 120.9676 },
  
  // Other provinces
  'Antipolo': { lat: 14.5873, lng: 121.1759 },
  'Marikina': { lat: 14.6507, lng: 121.1029 },
  'San Juan': { lat: 14.6019, lng: 121.0355 },
  'Muntinlupa': { lat: 14.3631, lng: 121.0174 },
  'Parañaque': { lat: 14.4793, lng: 121.0198 },
  'Las Piñas': { lat: 14.4378, lng: 120.9761 },
  'Valenzuela': { lat: 14.7072, lng: 120.9822 },
  'Malabon': { lat: 14.6648, lng: 120.9568 },
  'Navotas': { lat: 14.6691, lng: 120.9496 }
};

function generateSignature(timestamp: string, method: string, path: string, body: unknown): string {
  const sortObject = (obj: any): any => {
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
  };

  const sortedBody = sortObject(body);
  const bodyString = JSON.stringify(sortedBody);
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${bodyString}`;
  
  return crypto.createHmac('sha256', LALAMOVE_API_SECRET).update(rawSignature).digest('hex');
}

function getCoordinatesFromAddress(city: string, province: string, street: string = ''): { lat: number; lng: number; address: string } {
  // Try to get coordinates from our predefined list
  const coords = CITY_COORDINATES[city];
  
  if (coords) {
    // Add some randomness to street addresses to simulate different locations within the city
    const streetOffset = street ? (street.length % 10) * 0.001 : 0;
    return {
      lat: coords.lat + streetOffset,
      lng: coords.lng + streetOffset,
      address: `${street ? street + ', ' : ''}${city}, ${province}, Philippines`
    };
  }
  
  // Default to Manila if city not found
  return {
    lat: 14.5995,
    lng: 120.9842,
    address: `${street ? street + ', ' : ''}${city}, ${province}, Philippines`
  };
}

async function callLalamoveLive(payload: any, retryCount: number = 0): Promise<any> {
  if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
    throw new Error('Lalamove API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/v3/quotations';
  
  const signature = generateSignature(timestamp, method, path, payload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LalamoveConfig.timeouts.quotation);

  try {
    const response = await fetch(`${LALAMOVE_API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
        'Market': LALAMOVE_MARKET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (isRetryableError(response.status) && retryCount < LalamoveConfig.retry.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, LalamoveConfig.retry.backoffMs));
        return callLalamoveLive(payload, retryCount + 1);
      }

      const error: any = new Error('Lalamove API error');
      error.statusCode = response.status;
      error.lalamoveError = data;
      throw error;
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' && retryCount < LalamoveConfig.retry.maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, LalamoveConfig.retry.backoffMs));
      return callLalamoveLive(payload, retryCount + 1);
    }

    if (error.statusCode) {
      throw error;
    }

    throw new Error('Network error connecting to delivery service. Please try again.');
  }
}

async function handleSimulatorQuotation(order: any) {
  const storeCity = order.store.city || 'Manila';
  const storeProvince = order.store.province || 'Metro Manila';
  const storeStreet = order.store.street || '';
  const buyerCity = order.buyer.city;
  const buyerProvince = order.buyer.province;
  const buyerStreet = order.buyer.street || '';

  if (!buyerCity || !buyerProvince) {
    throw new Error('Buyer city and province are required.');
  }

  // Convert manual addresses to coordinates
  const pickupLocation = getCoordinatesFromAddress(storeCity, storeProvince, storeStreet);
  const deliveryLocation = getCoordinatesFromAddress(buyerCity, buyerProvince, buyerStreet);

  // Create normalized addresses for the simulator
  const pickupAddress = {
    lat: pickupLocation.lat,
    lng: pickupLocation.lng,
    displayName: pickupLocation.address,
    city: storeCity,
    province: storeProvince,
    country: 'Philippines'
  };

  const deliveryAddress = {
    lat: deliveryLocation.lat,
    lng: deliveryLocation.lng,
    displayName: deliveryLocation.address,
    city: buyerCity,
    province: buyerProvince,
    country: 'Philippines'
  };

  // Create contacts
  const requesterContact = {
    name: order.store.name || 'Seller',
    phone: order.store.phone || '+639123456789'
  };

  const recipientContact = {
    name: order.buyer.name,
    phone: order.buyer.phone
  };

  // Map service type
  const serviceType = mapServiceType(order.vehicle);

  // Create quotation using simulator service
  const quotationResponse = await mockLalamoveService.createQuotation(
    pickupAddress,
    deliveryAddress,
    serviceType,
    requesterContact,
    recipientContact,
    true // isCashOnDelivery
  );

  return {
    quotationId: quotationResponse.quotationId,
    price: quotationResponse.priceBreakdown,
    expiresAt: quotationResponse.expiresAt,
    distance: quotationResponse.distance
  };
}

async function handleLiveQuotation(order: any) {
  const storeCity = order.store.city || 'Manila';
  const storeProvince = order.store.province || 'Metro Manila';
  const storeStreet = order.store.street || '';
  const buyerCity = order.buyer.city;
  const buyerProvince = order.buyer.province;
  const buyerStreet = order.buyer.street || '';

  if (!buyerCity || !buyerProvince) {
    throw new Error('Buyer city and province are required.');
  }

  // Convert manual addresses to coordinates
  const pickupLocation = getCoordinatesFromAddress(storeCity, storeProvince, storeStreet);
  const deliveryLocation = getCoordinatesFromAddress(buyerCity, buyerProvince, buyerStreet);

  const pickupValidation = validateStop({
    coordinates: { lat: pickupLocation.lat, lng: pickupLocation.lng },
    address: pickupLocation.address,
    contact: {
      name: order.store.name || 'Seller',
      phone: order.store.phone || '+639123456789'
    }
  }, 'pickup');

  const dropoffValidation = validateStop({
    coordinates: { lat: deliveryLocation.lat, lng: deliveryLocation.lng },
    address: deliveryLocation.address,
    contact: {
      name: order.buyer.name,
      phone: order.buyer.phone
    }
  }, 'dropoff');

  if (!pickupValidation.valid || !dropoffValidation.valid) {
    const errors = [...pickupValidation.errors, ...dropoffValidation.errors];
    const error: any = new Error(errors[0]?.message || 'Invalid address information.');
    error.code = 'ERR_INSUFFICIENT_STOPS';
    throw error;
  }

  const v3Payload = buildV3QuotationPayload({
    pickup: pickupValidation.stop!,
    dropoff: dropoffValidation.stop!,
    serviceType: order.vehicle || 'MOTORCYCLE'
  });

  const payload = v3Payload.data;
  const data = await callLalamoveLive(payload);

  return {
    quotationId: data.quotationId,
    price: data.priceBreakdown,
    expiresAt: data.expiresAt,
    distance: data.distance
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1048576) {
      return NextResponse.json({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large.'
      }, { status: 413 });
    }

    const body = await request.json();
    const { order } = body;

    if (!order || !order.store || !order.buyer) {
      return NextResponse.json({
        code: 'ADDRESS_STOPS',
        message: 'Need pickup and drop-off with addresses.'
      }, { status: 422 });
    }

    let result;

    if (isSimulatorMode()) {
      // Use simulator service with manual address conversion
      result = await handleSimulatorQuotation(order);
    } else {
      // Use live Lalamove API with manual address conversion
      result = await handleLiveQuotation(order);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    // Handle specific error codes
    if (error.code) {
      return NextResponse.json({
        code: error.code,
        message: error.message
      }, { status: error.code === 'GEOCODE_DOWN' ? 503 : 422 });
    }

    if (error.statusCode) {
      const errorResponse = createErrorResponse(error, error.statusCode);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    return NextResponse.json({
      code: 'QUOTATION_ERROR',
      message: error.message || 'Failed to calculate delivery fee.'
    }, { status: 500 });
  }
}
