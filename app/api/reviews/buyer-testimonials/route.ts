import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

// In-memory cache
let cachedTestimonials: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/reviews/buyer-testimonials
 * Fetches verified buyer reviews with complete user profile data
 * Query params:
 * - limit: number of reviews to return (default: 20)
 * - minRating: minimum rating to include (default: 4)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const minRating = parseInt(searchParams.get('minRating') || '4');

    // Check cache first
    const now = Date.now();
    if (cachedTestimonials && (now - cachedTestimonials.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        testimonials: cachedTestimonials.data.slice(0, limit),
        total: Math.min(cachedTestimonials.data.length, limit),
        cached: true
      });
    }

    await dbConnect();

    // Aggregate reviews with complete user profile and product information
    const testimonials = await Review.aggregate([
      {
        $match: {
          status: 'active',
          verified: true, // Only verified purchases
          rating: { $gte: minRating }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyerProfile'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$buyerProfile'
      },
      {
        $unwind: {
          path: '$productInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          buyerId: 1, // Include buyer ID for profile linking
          rating: 1,
          title: 1,
          comment: 1,
          createdAt: 1,
          verified: 1,
          // User profile data from Users table - check both profilePicture and profileImage fields
          avatarUrl: { 
            $ifNull: [
              '$buyerProfile.profilePicture', 
              { $ifNull: ['$buyerProfile.profileImage', null] }
            ] 
          },
          fullName: { 
            $cond: {
              if: { 
                $and: [
                  { $ne: ['$buyerProfile.firstName', null] },
                  { $ne: ['$buyerProfile.firstName', ''] }
                ]
              },
              then: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ['$buyerProfile.firstName', ''] }, 
                      ' ', 
                      { $ifNull: ['$buyerProfile.lastName', ''] }
                    ]
                  }
                }
              },
              else: { $ifNull: ['$buyerProfile.name', 'Anonymous'] }
            }
          },
          city: { 
            $ifNull: [
              { $arrayElemAt: ['$buyerProfile.addresses.city', 0] },
              'Philippines'
            ] 
          },
          // Product info
          productName: { $ifNull: ['$productInfo.name', 'Product'] },
          productImage: { $ifNull: ['$productInfo.image', null] }
        }
      },
      {
        $sort: { createdAt: -1 } // Newest → oldest
      },
      {
        $limit: limit
      }
    ]);

    // Update cache
    cachedTestimonials = {
      data: testimonials,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      testimonials,
      total: testimonials.length
    });

  } catch (error) {
    console.error('Error fetching buyer testimonials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch testimonials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
