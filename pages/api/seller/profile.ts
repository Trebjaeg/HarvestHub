import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookies (check all possible cookie names)
    if (!token) {
      token = req.cookies['auth-token'] || req.cookies.token || req.cookies.userToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;

    // Get user/seller data
    const seller = await User.findById(userId).select('-password');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    return res.status(200).json({
      success: true,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone || null,
        address: seller.address || null,
        profileImage: seller.profileImage || null,
        farmName: seller.farmName || null,
        location: (seller as any).location || null,
        createdAt: seller.createdAt,
        joinedAt: seller.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}