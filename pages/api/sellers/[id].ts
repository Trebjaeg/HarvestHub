import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Review from '@/models/Review';
import { withLogging } from '@/lib/middleware';
import mongoose from 'mongoose';

async function sellerHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid seller ID' 
    });
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid seller ID format'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return await getSeller(req, res, id);
}

async function getSeller(req: NextApiRequest, res: NextApiResponse, sellerId: string) {
  try {
    const { page = '1', limit = '12', sort = 'recent' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50); // Cap at 50
    const skip = (pageNum - 1) * limitNum;

    // Get seller info with timeout (can be role 'seller' or 'farmer')
    const seller: any = await User.findById(sellerId)
      .select('firstName lastName name email profileImage profilePicture location accountStatus createdAt verified followers following role responseRate averageResponseTime totalMessagesReceived totalMessagesResponded')
      .maxTimeMS(3000)
      .lean();

    // Check if user exists
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // More lenient role check - accept seller, farmer, or no role (backward compatibility)
    if (seller.role && !['seller', 'farmer', 'admin', 'buyer'].includes(seller.role)) {
      return res.status(404).json({
        success: false,
        message: 'This user is not a seller'
      });
    }

    // Allow suspended sellers to be viewed (just mark them as suspended)
    const isActive = seller.accountStatus === 'active';
    const isSuspended = seller.accountStatus === 'suspended';

    // Get seller's products with sorting (farmerId is stored as String)
    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { soldCount: -1, createdAt: -1 };
    else if (sort === 'low-price') sortOption = { price: 1 };
    else if (sort === 'high-price') sortOption = { price: -1 };

    const products = await Product.find({ 
      farmerId: sellerId, 
      isActive: true 
    })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select('name price images category stock unit rating reviews')
      .maxTimeMS(5000)
      .lean()
      .catch((err) => {
        console.error('Error fetching products:', err);
        return [];
      });

    const totalProducts = await Product.countDocuments({ 
      farmerId: sellerId, 
      isActive: true 
    }).maxTimeMS(3000).catch(() => 0);

    // Calculate average rating from products (simpler approach)
    let averageRating = 0;
    let totalReviews = 0;
    if (products.length > 0) {
      const ratings = products.filter(p => p.rating && p.rating > 0);
      if (ratings.length > 0) {
        averageRating = ratings.reduce((sum, p) => sum + (p.rating || 0), 0) / ratings.length;
        totalReviews = products.reduce((sum, p) => sum + (p.reviews || 0), 0);
      }
    }

    // Get recent reviews - try to fetch but don't fail if it doesn't work
    let reviewsWithDetails = [];
    try {
      const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
      const recentReviews = await Review.find({ 
        sellerId: sellerObjectId, 
        status: 'approved' 
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('rating comment createdAt buyerId productId')
        .maxTimeMS(3000)
        .lean();

      // Only fetch buyer/product details if we have reviews
      if (recentReviews && recentReviews.length > 0) {
        const buyerIds = recentReviews.map((r: any) => r.buyerId).filter(Boolean);
        const productIds = recentReviews.map((r: any) => r.productId).filter(Boolean);
        
        const [buyers, reviewProducts] = await Promise.all([
          buyerIds.length > 0 ? User.find({ _id: { $in: buyerIds } })
            .select('firstName lastName name profileImage')
            .maxTimeMS(2000)
            .lean()
            .catch(() => []) : Promise.resolve([]),
          productIds.length > 0 ? Product.find({ _id: { $in: productIds } })
            .select('name images')
            .maxTimeMS(2000)
            .lean()
            .catch(() => []) : Promise.resolve([])
        ]);

        const buyerMap = new Map(buyers.map((b: any) => [b._id.toString(), b]));
        const productMap = new Map(reviewProducts.map((p: any) => [p._id.toString(), p]));

        reviewsWithDetails = recentReviews.map((review: any) => {
          const buyer = buyerMap.get(review.buyerId?.toString());
          const product = productMap.get(review.productId?.toString());
          
          return {
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            buyer: buyer ? {
              id: buyer._id,
              name: buyer.name || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
              profileImage: buyer.profileImage
            } : null,
            product: product ? {
              id: product._id,
              name: product.name,
              image: product.images?.[0]
            } : null
          };
        });
      }
    } catch (reviewError) {
      console.error('Error fetching reviews (non-fatal):', reviewError);
      // Continue without reviews - not a fatal error
    }

    // Calculate response rate and format response time
    const formatResponseTime = (minutes: number | null): string => {
      if (minutes === null || minutes === undefined) return null as any;
      if (minutes < 60) return `${Math.round(minutes)} min${Math.round(minutes) !== 1 ? 's' : ''}`;
      if (minutes < 1440) return `${Math.round(minutes / 60)} hour${Math.round(minutes / 60) !== 1 ? 's' : ''}`;
      return `${Math.round(minutes / 1440)} day${Math.round(minutes / 1440) !== 1 ? 's' : ''}`;
    };

    return res.status(200).json({
      success: true,
      data: {
        seller: {
          id: seller._id,
          name: seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller',
          email: seller.email,
          profileImage: seller.profileImage || seller.profilePicture,
          location: seller.location || 'Philippines',
          verified: seller.verified || false,
          isActive,
          isSuspended,
          memberSince: seller.createdAt,
          followers: seller.followers?.length || 0,
          following: seller.following?.length || 0,
          rating: {
            average: averageRating,
            total: totalReviews,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          },
          totalProducts,
          // Response metrics from database (null if not yet tracked)
          responseRate: seller.responseRate !== null && seller.responseRate !== undefined ? seller.responseRate : null,
          responseTime: formatResponseTime(seller.averageResponseTime),
          // Raw metrics for frontend to use if needed
          averageResponseTimeMinutes: seller.averageResponseTime || null,
          totalMessagesReceived: seller.totalMessagesReceived || 0,
          totalMessagesResponded: seller.totalMessagesResponded || 0
        },
        products: {
          items: products.map((p: any) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            images: p.images,
            category: p.category,
            stock: p.stock,
            unit: p.unit || 'kg',
            rating: p.rating || 0,
            reviewCount: p.reviews || 0
          })),
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum) || 1,
            totalProducts,
            hasMore: skip + products.length < totalProducts
          }
        },
        recentReviews: reviewsWithDetails
      }
    });
  } catch (error: any) {
    console.error('Get seller error:', error);
    
    // Provide more detailed error info in development
    const isDev = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seller information',
      error: isDev ? error.message : undefined,
      stack: isDev ? error.stack : undefined
    });
  }
}

// Public endpoint - no authentication required to view seller stores
export default withLogging(sellerHandler);
