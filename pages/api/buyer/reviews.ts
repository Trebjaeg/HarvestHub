import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Review from '../../../models/Review';
import Product from '../../../models/Product';

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

    // Verify buyer exists
    const buyer = await User.findById(decoded.userId);
    if (!buyer) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch buyer's reviews with product details
    const reviews = await Review.find({ 
      buyerId: decoded.userId 
    })
    .sort({ createdAt: -1 })
    .lean();

    // Get product details for each review
    const reviewsWithProducts = await Promise.all(
      reviews.map(async (review) => {
        const product = await Product.findById(review.productId).lean();
        return {
          ...review,
          productName: product?.name || 'Product Unavailable',
          productImage: product?.images?.[0] || null,
          productPrice: product?.price || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      reviews: reviewsWithProducts
    });
  } catch (error) {
    console.error('Error fetching buyer reviews:', error);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}
