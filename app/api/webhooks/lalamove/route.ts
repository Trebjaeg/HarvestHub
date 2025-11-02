import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyWebhookSignature } from '@/lib/lalamove-service';

// Socket.IO client for real-time updates
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
  } catch (err) {
    console.error('Failed to emit delivery update:', err);
  }
}

// Process webhook asynchronously (don't block response)
async function processWebhook(rawBody: string, signature: string, timestamp: string) {
  try {
    console.log('📦 Webhook Raw Body:', rawBody);
    
    const body = JSON.parse(rawBody);
    console.log('📦 Webhook Parsed Body:', body);

    // Verify webhook signature (optional, can log warning instead of blocking)
    console.log('🔐 Signature Verification:', { signature, timestamp });

    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.warn('⚠️ Invalid Lalamove webhook signature (processing anyway for testing)');
      // Continue processing in sandbox mode
    } else {
      console.log('✅ Signature verified');
    }

    const { eventType, orderId: lalamoveOrderId, data } = body;

    await connectToDatabase();

    // Find order by Lalamove order ID
    const order = await Order.findOne({ lalamove_order_id: lalamoveOrderId });
    
    if (!order) {
      console.error(`❌ Order not found for Lalamove ID: ${lalamoveOrderId}`);
      return;
    }

    console.log(`📦 Order found: ${order._id}, Current status: ${order.status}`);

    // Handle different event types
    switch (eventType) {
      case 'ORDER_STATUS_CHANGED':
        console.log(`🔄 Status change: ${order.delivery_status} → ${data.status}`);
        order.delivery_status = data.status;
        
        // Map Lalamove status to HarvestHub status
        if (data.status === 'PICKED_UP') {
          order.status = 'shipped';
        } else if (data.status === 'COMPLETED') {
          order.status = 'delivered';
          order.actualDelivery = new Date();
        } else if (data.status === 'CANCELED' || data.status === 'REJECTED') {
          order.status = 'cancelled';
        }
        
        await order.save();
        console.log(`✅ Order updated: ${order._id}, New status: ${order.status}`);
        
        // Emit real-time update
        await emitDeliveryUpdate(order._id.toString(), data.status);
        break;

      case 'DRIVER_ASSIGNED':
        console.log('🚗 Driver assigned to order:', order._id);
        order.delivery_status = 'DRIVER_ASSIGNED';
        await order.save();
        
        // Emit real-time update with driver info
        await emitDeliveryUpdate(order._id.toString(), 'DRIVER_ASSIGNED');
        break;

      case 'ORDER_AMOUNT_CHANGED':
        console.log('💰 Delivery fee changed:', { old: order.deliveryFee, new: data.newAmount });
        // Update delivery fee if changed
        if (data.newAmount) {
          order.deliveryFee = data.newAmount;
          order.finalAmount = order.totalAmount + data.newAmount;
          await order.save();
          
          // Notify users of price change
          await emitDeliveryUpdate(order._id.toString(), 'PRICE_CHANGED');
        }
        break;

      default:
        console.log(`⚠️ Unhandled Lalamove event type: ${eventType}`);
    }

    console.log('✅ Webhook processed successfully');
  } catch (error: any) {
    console.error('❌ Error processing Lalamove webhook:', error);
    console.error('Stack trace:', error.stack);
  }
}

export async function POST(request: NextRequest) {
  // Log all incoming webhooks
  console.log('🔔 Lalamove Webhook Received:', {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // IMMEDIATELY return 200 OK to acknowledge receipt
  // This prevents "Destination host unreachable" errors
  const response = NextResponse.json({ 
    success: true,
    message: 'Webhook received',
    timestamp: new Date().toISOString()
  }, { status: 200 });

  // Process webhook asynchronously (don't await)
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Lalamove-Signature') || '';
    const timestamp = request.headers.get('X-Lalamove-Timestamp') || '';

    // Process in background without blocking response
    processWebhook(rawBody, signature, timestamp).catch(err => {
      console.error('Background webhook processing error:', err);
    });
  } catch (error) {
    console.error('Error reading webhook body:', error);
  }

  return response;
}

// Also handle GET for Lalamove verification/ping
export async function GET(request: NextRequest) {
  console.log('🔔 Lalamove Webhook GET (verification):', {
    timestamp: new Date().toISOString(),
    url: request.url
  });

  return NextResponse.json({ 
    status: 'ready',
    endpoint: '/api/webhooks/lalamove',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
