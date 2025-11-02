import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache-control headers to prevent stale reads
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const userId = decoded.userId;

    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    // Find and delete the cart item
    const cartItem = await CartItem.findOneAndDelete({
      _id: itemId,
      userId: userId
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Get updated cart count
    const totalCount = await CartItem.countDocuments({ userId }).maxTimeMS(1000);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      count: totalCount
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
