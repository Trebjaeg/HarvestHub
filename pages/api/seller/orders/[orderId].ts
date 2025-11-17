import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set no-cache headers for real-time data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let sellerId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; id?: string };
      sellerId = decoded.userId || decoded.id;
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find order and verify it belongs to the seller
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the seller of this order
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        products: order.products,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        finalAmount: order.finalAmount,
        deliveryAddress: order.deliveryAddress,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderDate: order.orderDate,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery,
        notes: order.notes,
        // Include Lalamove tracking data
        lalamove_order_id: order.lalamove_order_id,
        lalamove_quotation_id: order.lalamove_quotation_id,
        lalamove_share_link: order.lalamove_share_link,
        // Include cancellation request data
        cancellationRequest: order.cancellationRequest ? {
          requestedBy: order.cancellationRequest.requestedBy,
          reason: order.cancellationRequest.reason,
          requestedAt: order.cancellationRequest.requestedAt,
          status: order.cancellationRequest.status
        } : undefined
      }
    });
  } catch (error) {
    console.error('Error fetching seller order details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}