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
    // Get user from auth token
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find order and verify it belongs to the user
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is buyer or seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
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
        notes: order.notes
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
