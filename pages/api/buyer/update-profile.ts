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
  if (req.method !== 'PUT') {
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

    // Verify buyer exists and has buyer role
    const buyer = await User.findById(decoded.userId) as any;
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(403).json({ error: 'Access denied. Buyer role required.' });
    }

    // Extract updatable fields from request body
    const { firstName, lastName, phone, address } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Update buyer profile
  buyer.firstName = firstName.trim();
  buyer.lastName = lastName.trim();
    if (phone) buyer.phone = phone.trim();
    if (address) buyer.address = address.trim();

    await buyer.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      buyer: {
        _id: buyer._id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phone: buyer.phone,
        address: buyer.address,
        profileImage: buyer.profileImage,
        createdAt: buyer.createdAt,
        role: buyer.role
      }
    });
  } catch (error) {
    console.error('Error updating buyer profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
