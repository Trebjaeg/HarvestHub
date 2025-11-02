import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    await dbConnect();

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 per page
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(5000),
      Notification.countDocuments({ userId })
    ]);

    const totalPages = Math.ceil(total / limit);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      notifications: notifications.map(n => ({
        id: (n._id as any).toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        orderNumber: n.orderNumber,
        isRead: n.isRead,
        metadata: n.metadata,
        createdAt: n.createdAt,
        readAt: n.readAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false },
      unreadCount: 0
    });
  }
}
