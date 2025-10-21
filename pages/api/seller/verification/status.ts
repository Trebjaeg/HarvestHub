import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import SellerApplication from '@/models/SellerApplication';
import dbConnect from '@/lib/mongodb';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * GET /api/seller/verification/status
 * Get seller verification status and application details
 * Protected route - seller only
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication check
  try {
    await dbConnect();
    
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'seller') {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Seller access required' 
      });
    }

    (req as any).user = user;
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = (req as any).user;

    // Get latest application
    const application = await SellerApplication.findOne({
      userId: user._id,
    }).sort({ createdAt: -1 });

    if (!application) {
      return res.status(200).json({
        sellerStatus: user.sellerStatus || 'none',
        hasApplication: false,
        message: 'No verification application found',
      });
    }

    return res.status(200).json({
      sellerStatus: user.sellerStatus,
      hasApplication: true,
      application: {
        id: application._id,
        status: application.status,
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        rejectionReason: application.rejectionReason,
      },
    });
  } catch (error: any) {
    console.error('Error fetching verification status:', error);
    return res.status(500).json({
      error: 'Failed to fetch verification status',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

export default handler;
