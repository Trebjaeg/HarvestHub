import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Order from '../../../models/Order';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['auth-token'] || req.cookies['hh_token'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify buyer exists and can access buyer features
    const buyer = await User.findById(decoded.userId);
    if (!buyer) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Block admin/superadmin from buyer endpoints
    if (buyer.role === 'admin' || buyer.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admins should use admin endpoints.' });
    }

    // Fetch buyer statistics
    // Note: Adjust these queries based on your Order model structure
    const orders = await Order.find({ buyerId: decoded.userId });
    
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      favoriteProducts: 0, // You'll need to implement favorites functionality
      averageRating: 0 // You'll need to implement rating functionality
    };

    return res.status(200).json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching buyer stats:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      // Return default stats on error
      totalOrders: 0,
      totalSpent: 0,
      favoriteProducts: 0,
      averageRating: 0
    });
  }
}
