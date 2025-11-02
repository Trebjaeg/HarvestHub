import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import jwt from 'jsonwebtoken';
import { notifyOrderStatusUpdate } from '../../../../../lib/notification-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify buyer owns this order
    if (order.buyerId !== buyerId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this order' });
    }

    // Can only receive if status is "shipped"
    if (order.status !== 'shipped') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot mark as received. Order status is "${order.status}"` 
      });
    }

    // Update order status to "delivered"
    order.status = 'delivered';
    order.actualDelivery = new Date();
    order.updatedAt = new Date();

    await order.save();

    // Send notification to seller
    try {
      await notifyOrderStatusUpdate(
        order.sellerId,
        order.orderNumber,
        order._id.toString(),
        'delivered',
        order.buyerName || 'Customer'
      );
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Order marked as received successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        actualDelivery: order.actualDelivery
      }
    });

  } catch (error: any) {
    console.error('Error marking order as received:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to mark order as received',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
