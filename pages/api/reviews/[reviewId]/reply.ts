import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { ObjectId } from 'mongodb';
import { createNotification } from '@/lib/notification-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Authenticate seller
    const token = req.cookies['auth-token'] || req.cookies.token || req.cookies['hh_token'];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (decoded.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Only sellers can reply to reviews' });
    }

    const sellerId = decoded.userId || decoded.id;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Invalid user session' });
    }

    const { reviewId } = req.query;
    const { sellerResponse } = req.body;

    if (!reviewId || typeof reviewId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    if (!sellerResponse || !sellerResponse.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Seller response is required'
      });
    }

    if (sellerResponse.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Seller response must not exceed 1000 characters'
      });
    }

    // Get the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if seller already replied
    if (review.sellerResponse && review.sellerResponse.comment) {
      return res.status(400).json({
        success: false,
        message: 'You have already replied to this review'
      });
    }

    // Get product to verify seller owns it
    const product = await Product.findById(review.productId).select('farmerId name');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.farmerId) {
      return res.status(500).json({
        success: false,
        message: 'Product has no seller information'
      });
    }

    // Verify seller owns the product
    if (product.farmerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only reply to reviews on your own products'
      });
    }

    // Update review with seller response
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          'sellerResponse.comment': sellerResponse,
          'sellerResponse.respondedAt': new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      throw new Error('Failed to update review');
    }

    // Create notification for buyer (don't let notification errors break the reply)
    if (review.buyerId && product._id && updatedReview._id && product.farmerId) {
      try {
        await createNotification({
          userId: review.buyerId.toString(),
          userRole: 'buyer',
          type: 'review_response',
          title: 'Seller Responded to Your Review',
          message: `The seller responded to your ${review.rating}-star review on ${product.name}: "${sellerResponse.substring(0, 100)}${sellerResponse.length > 100 ? '...' : ''}"`,
          metadata: {
            productId: product._id.toString(),
            productName: product.name,
            reviewId: updatedReview._id.toString(),
            sellerId: product.farmerId.toString(),
            link: `/product/${product._id.toString()}`
          }
        });
      } catch (notifError) {
        // Notification failed but reply was saved successfully
      }
    }

    res.status(200).json({
      success: true,
      message: 'Reply submitted successfully',
      data: {
        reviewId: updatedReview._id,
        sellerResponse: updatedReview.sellerResponse
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit reply'
    });
  }
}
