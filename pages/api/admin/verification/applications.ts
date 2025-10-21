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
 * GET /api/admin/verification/applications
 * List all seller verification applications
 * Protected route - admin/superadmin only
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

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Admin access required' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account not active',
        message: 'Your account is not active' 
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
    const { status, page = '1', limit = '20' } = req.query;

    // Build filter
    const filter: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get applications with user details
    const applications = await SellerApplication.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email phone address createdAt')
      .populate('reviewedBy', 'name email')
      .lean();

    const total = await SellerApplication.countDocuments(filter);

    return res.status(200).json({
      success: true,
      applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      error: 'Failed to fetch applications',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

export default handler;
