import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  // Fetch buyer profile
  const buyer = await User.findById(decoded.userId).select('-password -loginAttempts -lockUntil') as any;

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Check if user can access buyer features (buyers, users, sellers can all access buyer features)
    // Only block admin/superadmin from buyer endpoints
    if (buyer.role === 'admin' || buyer.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admins should use admin endpoints.' });
    }

    // Split name into firstName and lastName for frontend compatibility
    const nameParts = (buyer.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return res.status(200).json({
      success: true,
      buyer: {
        _id: buyer._id,
        firstName: firstName,
        lastName: lastName,
        name: buyer.name, // Also include full name
        email: buyer.email,
        phone: buyer.phone || null,
        address: buyer.address || null,
        addresses: buyer.addresses || [], // Include saved addresses
        profileImage: buyer.profileImage || null,
        createdAt: buyer.createdAt,
        role: buyer.role
      }
    });
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
