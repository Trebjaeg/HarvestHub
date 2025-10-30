import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/mongodb';
import Review from '../../../../models/Review';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { reviewId } = req.query;

  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['auth-token'] || req.cookies['hh_token'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify ownership
    if (review.buyerId.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    if (req.method === 'PUT') {
      // Update review
      const { rating, title, comment } = req.body;

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      if (rating) review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment) review.comment = comment;
      review.updatedAt = new Date();

      await review.save();

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        review
      });
    }

    if (req.method === 'DELETE') {
      // Delete review (soft delete by changing status)
      review.status = 'removed';
      await review.save();

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}
