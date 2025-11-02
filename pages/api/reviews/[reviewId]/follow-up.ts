import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Review from '../../../../models/Review';
import Product from '../../../../models/Product';
import jwt from 'jsonwebtoken';
import { createNotification } from '../../../../lib/notification-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const token = req.cookies['auth-token'] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    await dbConnect();

    const { reviewId } = req.query;
    const { comment } = req.body;

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Follow-up comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ success: false, message: 'Follow-up comment must not exceed 500 characters' });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Verify the user is the buyer who wrote the review
    if (review.buyerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only add follow-ups to your own reviews' });
    }

    // Add follow-up review
    if (!review.followUpReviews) {
      review.followUpReviews = [];
    }

    review.followUpReviews.push({
      comment: comment.trim(),
      createdAt: new Date()
    });

    await review.save();

    // Get product info for notification
    const product = await Product.findById(review.productId).select('name farmerId').lean();
    
    // Notify seller about buyer's follow-up
    if (product && (product as any).farmerId) {
      try {
        await createNotification({
          userId: (product as any).farmerId.toString(),
          userRole: 'seller',
          type: 'review_response' as any,
          title: 'New Follow-up Review',
          message: `A buyer added a follow-up to their review on ${(product as any).name}: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
          metadata: {
            productId: (product as any)._id.toString(),
            productName: (product as any).name,
            reviewId: review._id.toString(),
            buyerId: userId,
            link: `/product/${(product as any)._id.toString()}`
          }
        });
      } catch (notifError) {
        // Notification failed but follow-up was saved
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Follow-up review added successfully'
    });

  } catch (error) {
    console.error('Error adding follow-up review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add follow-up review'
    });
  }
}
