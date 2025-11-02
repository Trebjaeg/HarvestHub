import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // Get the order to verify it exists and get buyer ID
    const order = await Order.findById(orderId).select('buyerId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // TODO: Verify the requesting user is the buyer
    // For now, we'll just return all reviews for this order

    // Get all reviews for this order
    const reviews = await Review.find({
      orderId: orderId
    }).select('productId rating title comment images verified createdAt followUpReviews sellerResponse').lean();

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error: any) {
    console.error('Error fetching order reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
