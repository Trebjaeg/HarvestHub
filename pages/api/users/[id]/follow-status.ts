import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withLogging } from '@/lib/middleware';
import jwt from 'jsonwebtoken';

async function followStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check authentication from cookie
  const token = req.cookies['auth-token'];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  let userId: string;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }
    const decoded = jwt.verify(token, secret) as any;
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user ID' 
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const currentUser = await User.findById(userId).select('following');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = currentUser.following?.includes(id) || false;

    return res.status(200).json({
      success: true,
      isFollowing
    });
  } catch (error: any) {
    console.error('Follow status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check follow status'
    });
  }
}

export default withLogging(followStatusHandler);
