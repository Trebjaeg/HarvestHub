import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

/**
 * POST /api/seller/orders/[orderId]/delivery-attempt
 * Seller marks a delivery attempt (1st or 2nd)
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
    const { attemptNumber, status, notes } = req.body;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    // Validate attempt number (1 or 2)
    if (![1, 2].includes(attemptNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attempt number. Must be 1 or 2' 
      });
    }

    // Validate status
    if (!['failed', 'successful'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be "failed" or "successful"' 
      });
    }

    // Extract seller ID from token
    const token = 
      req.cookies.token || 
      req.cookies['auth-token'] || 
      req.cookies['hh_token'] ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    let sellerId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      sellerId = decoded.userId;
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Fetch the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller owns this order
    if (order.sellerId.toString() !== sellerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update this order' 
      });
    }

    // Check if order is in shipped status
    if (order.status !== 'shipped') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only mark delivery attempts for shipped orders' 
      });
    }

    // Initialize deliveryAttempts array if it doesn't exist
    if (!order.deliveryAttempts) {
      order.deliveryAttempts = [];
    }

    // Check if this attempt number already exists
    const existingAttempt = order.deliveryAttempts.find(
      (attempt: any) => attempt.attemptNumber === attemptNumber
    );

    if (existingAttempt) {
      return res.status(400).json({ 
        success: false, 
        message: `Delivery attempt ${attemptNumber} has already been recorded` 
      });
    }

    // Add the delivery attempt
    order.deliveryAttempts.push({
      attemptNumber,
      attemptDate: new Date(),
      status,
      notes: notes || '',
      markedBy: sellerId
    });

    // If successful, mark order as delivered
    if (status === 'successful') {
      order.status = 'delivered';
      order.actualDelivery = new Date();
    }

    await order.save();

    // TODO: Send notification to buyer about delivery attempt

    return res.status(200).json({
      success: true,
      message: `Delivery attempt ${attemptNumber} marked as ${status}`,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryAttempts: order.deliveryAttempts
      }
    });

  } catch (error) {
    console.error('❌ Error marking delivery attempt:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to mark delivery attempt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
