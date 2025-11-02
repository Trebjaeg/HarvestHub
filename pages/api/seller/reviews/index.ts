import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import User from '@/models/User';
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

    const { page = '1', limit = '10', rating, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = { sellerId, status: 'active' };
    
    if (rating && rating !== 'all') {
      filter.rating = parseInt(rating as string);
    }

    // Get all reviews for seller's products
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Review.countDocuments(filter);

    // Get product and buyer info for each review
    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review: any) => {
        const [product, buyer] = await Promise.all([
          Product.findById(review.productId).select('name images').lean(),
          User.findById(review.buyerId).select('name profilePicture').lean()
        ]);

        let matchesSearch = true;
        if (search && typeof search === 'string') {
          const searchLower = search.toLowerCase();
          matchesSearch = 
            (product as any)?.name?.toLowerCase().includes(searchLower) ||
            (buyer as any)?.name?.toLowerCase().includes(searchLower) ||
            review.comment.toLowerCase().includes(searchLower);
        }

        return {
          ...review,
          _id: review._id.toString(),
          id: review._id.toString(),
          productId: review.productId.toString(),
          buyerId: review.buyerId.toString(),
          productName: (product as any)?.name || 'Product Unavailable',
          productImage: (product as any)?.images?.[0] || null,
          buyer: buyer ? {
            name: (buyer as any).name,
            profileImage: (buyer as any).profilePicture
          } : null,
          matchesSearch
        };
      })
    );

    // Filter by search term if provided
    const filteredReviews = search 
      ? reviewsWithDetails.filter(r => r.matchesSearch)
      : reviewsWithDetails;

    return res.status(200).json({
      success: true,
      data: {
        reviews: filteredReviews,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalReviews: total,
          hasMore: skip + reviews.length < total
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching seller reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
