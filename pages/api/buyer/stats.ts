import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Order from '../../../models/Order';
import Favorite from '../../../models/Favorite';
import Review from '../../../models/Review';

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
    const orders = await Order.find({ buyerId: decoded.userId });
    
    // Get favorites count
    const favoritesCount = await Favorite.countDocuments({ 
      buyerId: decoded.userId,
      isActive: true 
    });
    
    // Get reviews and calculate average rating given by buyer
    const reviews = await Review.find({ 
      buyerId: decoded.userId,
      status: 'active'
    });
    
    const averageRatingGiven = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    // Only count completed/delivered orders for total spent
    const completedOrders = orders.filter(order => 
      order.status === 'completed' || order.status === 'delivered'
    );
    
    const stats = {
      totalOrders: completedOrders.length,
      totalSpent: completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      favoriteProducts: favoritesCount,
      averageRating: parseFloat(averageRatingGiven.toFixed(1)),
      totalReviews: reviews.length
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
