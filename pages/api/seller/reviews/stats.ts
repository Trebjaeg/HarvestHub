import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate seller
    const token = req.cookies['auth-token'] || req.cookies.token || req.cookies['hh_token'];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let sellerId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      sellerId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    await dbConnect();

    // Get all reviews for seller's products
    const reviews = await Review.find({ 
      sellerId, 
      status: 'active' 
    }).lean();

    const totalReviews = reviews.length;

    // Calculate average rating
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    // Calculate response rate
    const reviewsWithResponse = reviews.filter(r => r.sellerResponse).length;
    const responseRate = totalReviews > 0
      ? (reviewsWithResponse / totalReviews) * 100
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating,
        ratingDistribution,
        responseRate
      }
    });

  } catch (error: any) {
    console.error('Error fetching seller review stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch review stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
