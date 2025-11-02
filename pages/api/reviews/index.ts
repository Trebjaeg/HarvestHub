import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Product from '@/models/Product';
import ChatMessage, { generateConversationId } from '@/models/ChatMessage';
import { ObjectId } from 'mongodb';
import { createNotification } from '@/lib/notification-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { orderId, productId, rating, title, comment, verified, images } = req.body;

    // Validate required fields
    if (!orderId || !productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, productId, rating, and comment are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate comment length
    if (comment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 10 characters'
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must not exceed 2000 characters'
      });
    }

    // Validate title length if provided
    if (title && title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Review title must not exceed 200 characters'
      });
    }

    // Get buyer ID from session/auth
    // For now, we'll get it from the order
    const order = await Order.findById(orderId).select('buyerId buyerName status products sellerId sellerName orderNumber');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order is delivered or completed
    if (order.status !== 'delivered' && order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review delivered or completed orders'
      });
    }

    // Verify product is in the order
    const productInOrder = order.products.find(
      (p: any) => p.productId.toString() === productId
    );

    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Get product details for product name
    const product = await Product.findById(productId).select('name sellerId');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Use product sellerId or fallback to order sellerId
    const sellerId = product.sellerId || order.sellerId;
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine seller for this product'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      orderId: new ObjectId(orderId),
      productId: new ObjectId(productId),
      buyerId: order.buyerId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create the review
    const review = await Review.create({
      productId: new ObjectId(productId),
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      orderId: new ObjectId(orderId),
      sellerId: sellerId,
      rating,
      title: title || undefined,
      comment,
      images: images || [],
      verified: verified || true, // Mark as verified purchase
      helpful: 0,
      reported: false,
      status: 'active'
    });

    // Update product rating
    if (product) {
      // Get all reviews for this product
      const allReviews = await Review.find({
        productId: new ObjectId(productId),
        status: 'active'
      }).select('rating');

      // Calculate new average rating
      const totalRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      // Update product
      await Product.findByIdAndUpdate(productId, {
        rating: averageRating,
        reviewCount: allReviews.length
      });
    }

    // Create notification for seller
    const starEmoji = '⭐'.repeat(rating);
    await createNotification({
      userId: sellerId.toString(),
      userRole: 'seller',
      type: 'review',
      title: `New ${rating}-Star Review`,
      message: `${order.buyerName} left a ${rating}-star review on ${product.name}: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
      metadata: {
        productId: productId,
        productName: product.name,
        reviewId: review._id.toString(),
        rating,
        buyerId: order.buyerId.toString(),
        buyerName: order.buyerName
      }
    });

    // Send chat message to seller about the review
    try {
      const conversationId = generateConversationId(order.buyerId.toString(), sellerId.toString());
      
      await ChatMessage.create({
        conversationId,
        senderId: order.buyerId,
        senderName: order.buyerName,
        senderRole: 'buyer',
        receiverId: sellerId,
        receiverName: order.sellerName || 'Seller',
        receiverRole: 'seller',
        message: `✅ Review submitted for ${product.name} (Order #${order.orderNumber})\n${starEmoji} ${rating}/5 stars\n"${comment}"`,
        isRead: false
      });
    } catch (chatError) {
      console.error('Failed to send chat message:', chatError);
      // Don't fail the review submission if chat message fails
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        reviewId: review._id,
        rating: review.rating,
        productId: review.productId
      }
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
