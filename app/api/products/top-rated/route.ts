import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

interface ReviewStat {
  _id: string;
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  qualityScore: number;
}

interface ProductDocument {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currentPrice?: number;
  basePrice?: number;
  originalPrice?: number;
  unit: string;
  inventory_available: number;
  image: string;
  farmerId: string;
  farmerName: string;
  isOrganic?: boolean;
  featured?: boolean;
  tags?: string[];
  activeDealId?: string;
  createdAt: string;
  updatedAt: string;
}

interface EnrichedProduct {
  _id: string;
  name: string;
  description?: string;
  category: string;
  basePrice?: number;
  currentPrice: number;
  unit: string;
  stock: number;
  imageUrl: string;
  farmerId: string;
  farmerName: string;
  isOrganic?: boolean;
  isFeatured?: boolean;
  tags: string[];
  activeDealId?: string;
  rating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/products/top-rated
 * Fetches top-rated products based on average ratings and review counts
 * Query params:
 * - limit: number of products to return (default: 20)
 * - minRating: minimum average rating (default: 4.0)
 * - minReviews: minimum number of reviews (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const minRating = parseFloat(searchParams.get('minRating') || '4.0');
    const minReviews = parseInt(searchParams.get('minReviews') || '1');

    // Aggregate reviews to get average ratings and counts for all products
    const reviewStats = await Review.aggregate([
      {
        $match: {
          status: 'active' // Only count active reviews
        }
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          }
        }
      },
      {
        $match: {
          averageRating: { $gte: minRating },
          totalReviews: { $gte: minReviews }
        }
      },
      {
        // Calculate a quality score combining rating and review count
        $addFields: {
          qualityScore: {
            $add: [
              { $multiply: ['$averageRating', 0.7] }, // 70% weight on rating
              { $multiply: [{ $min: [{ $divide: ['$totalReviews', 10] }, 5] }, 0.3] } // 30% weight on review count (capped)
            ]
          }
        }
      },
      {
        $sort: {
          qualityScore: -1, // Sort by quality score first
          fiveStarCount: -1, // Then by five-star count
          averageRating: -1, // Then by average rating
          totalReviews: -1 // Finally by total reviews
        }
      },
      {
        $limit: limit
      }
    ]);

    if (reviewStats.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        message: 'No top-rated products found'
      });
    }

    // Get product IDs from review stats
    const productIds = reviewStats.map(stat => stat._id);

    // Fetch actual product details
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      inventory_available: { $gt: 0 } // Only show products in stock
    }).lean() as unknown as ProductDocument[];

    // Merge review stats with product data
    const enrichedProducts: EnrichedProduct[] = products.map((product) => {
      const stats = reviewStats.find((stat: ReviewStat) => stat._id.toString() === product._id.toString());
      
      // Use currentPrice if deal is active, otherwise use regular price
      const currentPrice = product.currentPrice || product.price;
      const basePrice = product.basePrice || product.originalPrice || (product.currentPrice && product.currentPrice < product.price ? product.price : undefined);
      
      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        basePrice: basePrice,
        currentPrice: currentPrice,
        unit: product.unit,
        stock: product.inventory_available,
        imageUrl: product.image,
        farmerId: product.farmerId,
        farmerName: product.farmerName,
        isOrganic: product.isOrganic,
        isFeatured: product.featured,
        tags: product.tags || [],
        activeDealId: product.activeDealId,
        // Rating information
        rating: stats?.averageRating || 0,
        totalReviews: stats?.totalReviews || 0,
        fiveStarCount: stats?.fiveStarCount || 0,
        fourStarCount: stats?.fourStarCount || 0,
        qualityScore: stats?.qualityScore || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    // Sort by the original quality score order
    const sortedProducts = enrichedProducts.sort((a: EnrichedProduct, b: EnrichedProduct) => {
      const indexA = productIds.findIndex(id => id.toString() === a._id.toString());
      const indexB = productIds.findIndex(id => id.toString() === b._id.toString());
      return indexA - indexB;
    });

    return NextResponse.json({
      success: true,
      products: sortedProducts,
      total: sortedProducts.length,
      filters: {
        minRating,
        minReviews,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching top-rated products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top-rated products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
