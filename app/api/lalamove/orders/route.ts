import { NextRequest, NextResponse } from 'next/server';
import { LalamoveConfig, isMockMode } from '@/config/lalamove';
import { mockLalamoveService } from '@/services/mock-lalamove';
import crypto from 'crypto';

const LALAMOVE_API_URL = LalamoveConfig.baseUrl;
const LALAMOVE_API_KEY = LalamoveConfig.apiKey;
const LALAMOVE_API_SECRET = LalamoveConfig.secretKey;
const LALAMOVE_MARKET = LalamoveConfig.market;

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

async function callLalamoveLive(payload: any, retryCount: number = 0): Promise<any> {
  if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
    throw new Error('Lalamove API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/v3/orders';
  
  const signature = generateSignature(timestamp, method, path, payload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LalamoveConfig.timeouts.order);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotationId, remarks, metadata } = body;

    if (!quotationId) {
      return NextResponse.json({
        code: 'MISSING_QUOTATION_ID',
        message: 'Quotation ID is required to create an order.'
      }, { status: 400 });
    }

    let result;

    if (LalamoveConfig.mode === 'SIMULATOR') {
      // Use simulated service
      result = await mockLalamoveService.createOrder(quotationId, remarks, metadata);
    } else {
      // Use live Lalamove API
      const payload = {
        data: {
          quotationId,
          remarks: remarks || `HarvestHub Order`,
          metadata: metadata || {}
        }
      };

      result = await callLalamoveLive(payload);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('expired')) {
      return NextResponse.json({
        code: 'QUOTATION_EXPIRED',
        message: error.message
      }, { status: 410 });
    }

    if (error.statusCode) {
      return NextResponse.json({
        code: 'LALAMOVE_ERROR',
        message: error.message || 'Failed to create delivery order'
      }, { status: error.statusCode });
    }

    return NextResponse.json({
      code: 'ORDER_CREATION_ERROR',
      message: error.message || 'Failed to create delivery order'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({
        code: 'MISSING_ORDER_ID',
        message: 'Order ID is required'
      }, { status: 400 });
    }

    let result;

    if (LalamoveConfig.mode === 'SIMULATOR') {
      // Use simulated service
      result = await mockLalamoveService.getOrder(orderId);
      
      if (!result) {
        return NextResponse.json({
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }, { status: 404 });
      }
    } else {
      // Use live Lalamove API
      const timestamp = Date.now().toString();
      const method = 'GET';
      const path = `/v3/orders/${orderId}`;
      
      const signature = generateSignature(timestamp, method, path, '');

      const response = await fetch(`${LALAMOVE_API_URL}${path}`, {
        method,
        headers: {
          'Accept': 'application/json',
          'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
          'Market': LALAMOVE_MARKET,
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }, { status: 404 });
        }
        throw new Error('Failed to fetch order details');
      }

      result = await response.json();
    }

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({
      code: 'ORDER_FETCH_ERROR',
      message: error.message || 'Failed to fetch order details'
    }, { status: 500 });
  }
}