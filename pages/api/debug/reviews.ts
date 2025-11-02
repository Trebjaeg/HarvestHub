import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';

/**
 * Debug endpoint to check review data structure
 * GET /api/debug/reviews?productId=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const Review = (await import('@/models/Review')).default;
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    // Get reviews for this product
    const reviews = await Review.find({ productId }).lean();

    // Return detailed debug info
    const debugInfo = reviews.map((review: any) => ({
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment?.substring(0, 50) + '...',
      status: review.status,
      hasSellerResponse: !!review.sellerResponse,
      sellerResponseComment: review.sellerResponse?.comment || null,
      sellerResponseRespondedAt: review.sellerResponse?.respondedAt || null,
      followUpReviewsCount: review.followUpReviews?.length || 0,
      createdAt: review.createdAt
    }));

    return res.status(200).json({
      success: true,
      totalReviews: reviews.length,
      reviews: debugInfo,
      sampleReview: reviews[0] // Return full first review for inspection
    });

  } catch (error: any) {
    console.error('Debug reviews error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
