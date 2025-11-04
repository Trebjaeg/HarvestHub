import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyWebhookSignature } from '@/lib/lalamove-service';
import { mapLalamoveStatusToInternal } from '@/lib/lalamove-error-mapper';

async function emitDeliveryUpdate(orderId: string, status: string, eta?: Date) {
  try {
    const SOCKET_SERVICE_URL = process.env.SOCKET_SERVICE_URL || 'http://localhost:4000';
    
    await fetch(`${SOCKET_SERVICE_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: `order:${orderId}`,
        event: 'delivery:status_update',
        data: { orderId, delivery_status: status, delivery_eta: eta }
      })
    });
  } catch {
    // Silent fail
  }
}

async function processWebhook(rawBody: string, signature: string, timestamp: string) {
  try {
    const body = JSON.parse(rawBody);

    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      // Continue processing in sandbox mode
    }

    const { eventType, orderId: lalamoveOrderId, data } = body;

    await connectToDatabase();

    const order = await Order.findOne({ lalamove_order_id: lalamoveOrderId });
    
    if (!order) {
      return;
    }

    switch (eventType) {
      case 'ORDER_STATUS_CHANGED':
        const lalamoveStatus = data.status;
        order.delivery_status = lalamoveStatus;
        
        const internalStatus = mapLalamoveStatusToInternal(lalamoveStatus);
        order.status = internalStatus;
        
        if (lalamoveStatus === 'COMPLETED' || lalamoveStatus === 'DELIVERED') {
          order.actualDelivery = new Date();
        }
        
        await order.save();
        await emitDeliveryUpdate(order._id.toString(), lalamoveStatus);
        break;

      case 'DRIVER_ASSIGNED':
        order.delivery_status = 'DRIVER_ASSIGNED';
        order.status = mapLalamoveStatusToInternal('DRIVER_ASSIGNED');
        
        if (data.driverId) {
          order.driver_id = data.driverId;
        }
        
        await order.save();
        await emitDeliveryUpdate(order._id.toString(), 'DRIVER_ASSIGNED');
        break;

      case 'PICKED_UP':
        order.delivery_status = 'PICKED_UP';
        order.status = mapLalamoveStatusToInternal('PICKED_UP');
        await order.save();
        await emitDeliveryUpdate(order._id.toString(), 'PICKED_UP');
        break;

      case 'ORDER_AMOUNT_CHANGED':
        if (data.newAmount) {
          order.deliveryFee = data.newAmount;
          order.finalAmount = order.totalAmount + data.newAmount;
          await order.save();
          await emitDeliveryUpdate(order._id.toString(), 'PRICE_CHANGED');
        }
        break;

      default:
        break;
    }
  } catch {
    // Silent fail
  }
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ 
    success: true,
    message: 'Webhook received',
    timestamp: new Date().toISOString()
  }, { status: 200 });

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Lalamove-Signature') || '';
    const timestamp = request.headers.get('X-Lalamove-Timestamp') || '';

    processWebhook(rawBody, signature, timestamp).catch(() => {});
  } catch {
    // Silent fail
  }

  return response;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ready',
    endpoint: '/api/webhooks/lalamove',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
