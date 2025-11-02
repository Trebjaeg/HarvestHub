import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No notification IDs provided' });
    }

    // Limit to 50 IDs per request
    const idsToUpdate = ids.slice(0, 50);

    // Update notifications
    await Notification.updateMany(
      {
        _id: { $in: idsToUpdate },
        userId // Security: only mark user's own notifications
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.status(200).json({ 
      success: true, 
      message: 'Notifications marked as read',
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
}
