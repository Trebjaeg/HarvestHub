import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { createNotification } from '@/lib/notification-utils';
import { releaseCommittedInventory } from '@/lib/inventory-manager';

/**
 * POST /api/buyer/orders/[orderId]/refuse
 * Buyer refuses delivery of a shipped order
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { orderId } = req.query;
    const { reason } = req.body;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ message: 'Refusal reason is required' });
    }

    // Extract buyer ID from token
    const token = 
      req.cookies.token || 
      req.cookies['auth-token'] || 
      req.cookies['hh_token'] ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    let buyerId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      buyerId = decoded.userId;
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Fetch the order
    const order = await Order.findById(orderId).populate('products.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify buyer owns this order
    if (order.buyerId.toString() !== buyerId) {
      return res.status(403).json({ message: 'You do not have permission to refuse this order' });
    }

    // Validate order status - can only refuse if shipped
    if (order.status !== 'shipped') {
      return res.status(400).json({ 
        message: `Cannot refuse order with status: ${order.status}. Order must be shipped to refuse delivery.` 
      });
    }

    // Update order status to cancelled and store refusal reason
    order.status = 'cancelled';
    order.refusalReason = reason.trim();
    order.refusalDate = new Date();
    
    // Add to notes for audit trail
    if (!order.notes) {
      order.notes = [];
    }
    order.notes.push({
      text: `Buyer refused delivery: ${reason.trim()}`,
      createdAt: new Date()
    });

    await order.save();

    // Release committed inventory back to available stock
    try {
      const items = order.products.map((item: any) => ({
        productId: typeof item.productId === 'object' && item.productId._id 
          ? item.productId._id.toString() 
          : item.productId.toString(),
        quantity: item.quantity
      }));
      
      await releaseCommittedInventory(items);
      console.log(`✅ Released inventory for refused order ${orderId}`);
    } catch (inventoryError) {
      console.error('❌ Failed to release inventory for refused order:', inventoryError);
      // Continue anyway - order is already refused, we can fix inventory manually if needed
    }

    // Notify seller about the refusal
    try {
      await createNotification({
        userId: order.sellerId.toString(),
        userRole: 'seller',
        type: 'order_cancelled',
        title: 'Order Refused',
        message: `Buyer refused delivery of order ${order.orderNumber}. Reason: ${reason.trim()}`,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        relatedUserId: buyerId
      });
      console.log(`✅ Sent refusal notification to seller ${order.sellerId}`);
    } catch (notifyError) {
      console.error('❌ Failed to send refusal notification:', notifyError);
      // Continue anyway - order is refused, notification failure shouldn't block
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery refused successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        refusalReason: order.refusalReason,
        refusalDate: order.refusalDate
      }
    });

  } catch (error) {
    console.error('❌ Error refusing delivery:', error);
    return res.status(500).json({ 
      message: 'Failed to refuse delivery',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
