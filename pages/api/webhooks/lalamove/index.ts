import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyWebhookSignature } from '@/lib/lalamove-service';

// Disable body parser to read raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await getRawBody(req);
    
    // Parse the body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // Verify webhook signature
    const signature = req.headers['x-lalamove-signature'] as string || '';
    const timestamp = req.headers['x-lalamove-timestamp'] as string || '';

    if (!signature || !timestamp) {
      console.error('Missing signature or timestamp headers');
      return res.status(401).json({ error: 'Missing authentication headers' });
    }

    // Verify the signature
    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.error('Invalid Lalamove webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('Lalamove webhook received:', JSON.stringify(body, null, 2));

    const { eventType, orderId: lalamoveOrderId, data } = body;

    await connectToDatabase();

    // Find order by Lalamove order ID
    const order = await Order.findOne({ lalamove_order_id: lalamoveOrderId });
    
    if (!order) {
      console.error(`Order not found for Lalamove ID: ${lalamoveOrderId}`);
      // Return 200 to prevent retries for non-existent orders
      return res.status(200).json({ 
        success: true, 
        message: 'Order not found, but acknowledged' 
      });
    }

    // Handle different event types
    switch (eventType) {
      case 'ORDER_STATUS_CHANGED':
        console.log(`Order ${order.orderNumber} status changed to: ${data.status}`);
        order.delivery_status = data.status;
        
        // Map Lalamove status to HarvestHub status
        if (data.status === 'ASSIGNING_DRIVER' || data.status === 'ON_GOING') {
          order.status = 'shipped';
        } else if (data.status === 'PICKED_UP') {
          order.status = 'shipped';
        } else if (data.status === 'COMPLETED') {
          order.status = 'delivered';
          order.actualDelivery = new Date();
        } else if (data.status === 'CANCELED' || data.status === 'REJECTED' || data.status === 'EXPIRED') {
          order.status = 'cancelled';
        }
        
        await order.save();
        
        // Emit real-time update
        await emitDeliveryUpdate(order._id.toString(), data.status);
        break;

      case 'DRIVER_ASSIGNED':
        console.log(`Driver assigned to order ${order.orderNumber}`);
        order.delivery_status = 'DRIVER_ASSIGNED';
        await order.save();
        
        // Emit real-time update with driver info
        await emitDeliveryUpdate(order._id.toString(), 'DRIVER_ASSIGNED');
        break;

      case 'DRIVER_LOCATION_UPDATED':
        // Optional: Store driver location for real-time tracking
        console.log(`Driver location updated for order ${order.orderNumber}`);
        // You can emit this to socket for live map tracking
        break;

      case 'ORDER_AMOUNT_CHANGED':
        // Update delivery fee if changed
        if (data.newAmount) {
          console.log(`Delivery fee changed for order ${order.orderNumber}: ${data.newAmount}`);
          order.deliveryFee = data.newAmount;
          order.finalAmount = order.totalAmount + data.newAmount;
          await order.save();
          
          // Notify users of price change
          await emitDeliveryUpdate(order._id.toString(), 'PRICE_CHANGED');
        }
        break;

      default:
        console.log(`Unhandled Lalamove event type: ${eventType}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing Lalamove webhook:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
