import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

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

    // Check cookies if no Authorization header
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userToken' || name === 'auth-token' || name === 'hh_token') {
          token = value;
          break;
        }
      }
    }

    if (!token) {
      return res.status(200).json({ count: 0 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(200).json({ count: 0 });
    }

    // Get unread notification count from database
    const Notification = (await import('@/models/Notification')).default;
    const count = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    res.status(200).json({ count });

  } catch (error) {
    console.error('Notification count error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(200).json({ count: 0 });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
}