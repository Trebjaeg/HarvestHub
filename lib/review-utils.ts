import Product from '@/models/Product';
import Review from '@/models/Review';
import mongoose from 'mongoose';

/**
 * Update product rating and review count after a review is added, updated, or removed
 * This function calculates the average rating from all active reviews for a product
 */
export async function updateProductRating(productId: string | mongoose.Types.ObjectId): Promise<void> {
  try {
    const productObjectId = typeof productId === 'string' 
      ? new mongoose.Types.ObjectId(productId) 
      : productId;

    // Aggregate reviews to calculate average rating
    const ratingStats = await Review.aggregate([
      {
        $match: {
          productId: productObjectId,
          status: 'active' // Only count active reviews
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Update product with new rating data
    if (ratingStats.length > 0) {
      const { averageRating, totalReviews } = ratingStats[0];
      
      await Product.findByIdAndUpdate(productObjectId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviews: totalReviews
      });
    } else {
      // No reviews, reset to 0
      await Product.findByIdAndUpdate(productObjectId, {
        rating: 0,
        reviews: 0
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
}

/**
 * Batch update ratings for multiple products
 * Useful for maintenance or bulk operations
 */
export async function batchUpdateProductRatings(productIds: (string | mongoose.Types.ObjectId)[]): Promise<void> {
  try {
    const updatePromises = productIds.map(productId => updateProductRating(productId));
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error batch updating product ratings:', error);
    throw error;
  }
}

/**
 * Get top-rated products with detailed rating breakdown
 */
export async function getTopRatedProducts(options: {
  limit?: number;
  minRating?: number;
  minReviews?: number;
  category?: string;
} = {}) {
  const {
    limit = 20,
    minRating = 4.0,
    minReviews = 1,
    category
  } = options;

  try {
    // Build match criteria
    const matchCriteria: any = {
      status: 'active'
    };

    // Aggregate reviews to get stats
    const reviewStats = await Review.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStarCount: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStarCount: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStarCount: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStarCount: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStarCount: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      },
      {
        $match: {
          averageRating: { $gte: minRating },
          totalReviews: { $gte: minReviews }
        }
      },
      {
        $addFields: {
          qualityScore: {
            $add: [
              { $multiply: ['$averageRating', 0.7] },
              { $multiply: [{ $min: [{ $divide: ['$totalReviews', 10] }, 5] }, 0.3] }
            ]
          }
        }
      },
      {
        $sort: {
          qualityScore: -1,
          fiveStarCount: -1,
          averageRating: -1,
          totalReviews: -1
        }
      },
      { $limit: limit }
    ]);

    if (reviewStats.length === 0) {
      return [];
    }

    const productIds = reviewStats.map(stat => stat._id);

    // Build product query
    const productQuery: any = {
      _id: { $in: productIds },
      isActive: true,
      inventory_available: { $gt: 0 }
    };

    if (category) {
      productQuery.category = category;
    }

    const products = await Product.find(productQuery).lean();

    // Merge stats with products
    const enrichedProducts = products.map(product => {
      const stats = reviewStats.find(s => s._id.toString() === product._id.toString());
      return {
        ...product,
        ratingStats: stats || null
      };
    });

    return enrichedProducts;
  } catch (error) {
    console.error('Error getting top-rated products:', error);
    throw error;
  }
}
