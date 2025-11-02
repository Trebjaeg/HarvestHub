import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';
import { withSecurity, withLogging } from '@/lib/middleware';
import jwt from 'jsonwebtoken';

async function reviewsHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid product ID' 
    });
  }

  switch (req.method) {
    case 'GET':
      return await getReviews(req, res, id);
    case 'POST':
      return await createReview(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getReviews(req: NextApiRequest, res: NextApiResponse, productId: string) {
  try {
    const { page = '1', limit = '10', sort = 'recent', star } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let sortQuery: any = { createdAt: -1 };
    if (sort === 'helpful') sortQuery = { helpfulCount: -1 };
    else if (sort === 'high') sortQuery = { rating: -1 };
    else if (sort === 'low') sortQuery = { rating: 1 };

    // Build query filter
    const filter: any = { 
      productId, 
      status: 'active' 
    };
    
    // Add star filter if provided
    if (star) {
      const starNum = parseInt(star as string);
      if (starNum >= 1 && starNum <= 5) {
        filter.rating = starNum;
      }
    }

    const reviews = await Review.find(filter)
      .select('rating title comment images verified createdAt buyerId sellerResponse followUpReviews helpful status')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Review.countDocuments(filter);

    // Get buyer info for each review
    const User = (await import('@/models/User')).default;
    const reviewsWithBuyers = await Promise.all(
      reviews.map(async (review: any) => {
        const buyer = await User.findById(review.buyerId).select('name profilePicture').lean();
        
        // Ensure sellerResponse is properly structured
        const sellerResponse = review.sellerResponse && review.sellerResponse.comment ? {
          comment: review.sellerResponse.comment,
          respondedAt: review.sellerResponse.respondedAt
        } : null;
        
        return {
          ...review,
          id: review._id.toString(),
          buyerId: review.buyerId.toString(),
          buyer: buyer ? {
            id: (buyer as any)._id,
            name: (buyer as any).name,
            profilePicture: (buyer as any).profilePicture
          } : null,
          sellerResponse: sellerResponse,
          followUpReviews: review.followUpReviews || []
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        reviews: reviewsWithBuyers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalReviews: total,
          hasMore: skip + reviewsWithBuyers.length < total
        }
      }
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
}

async function createReview(req: NextApiRequest, res: NextApiResponse, productId: string) {
  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const { rating, comment, images, orderId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify the order belongs to the user and contains this product
    const order = await Order.findOne({
      _id: orderId,
      buyerId: userId,
      'items.productId': productId,
      status: 'delivered'
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order or product not delivered'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      orderId,
      productId,
      buyerId: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Get product to find sellerId
    const Product = (await import('@/models/Product')).default;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Create review
    const review = await Review.create({
      productId,
      orderId,
      buyerId: userId,
      sellerId: product.sellerId || product.farmerId,
      rating,
      comment,
      images: images || [],
      verified: true,
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully'
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
}

export default withLogging(withSecurity(reviewsHandler));
