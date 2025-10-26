import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import jwt from 'jsonwebtoken';
import { cache, cacheKeys } from '@/lib/redis';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Invalidate cart cache
    await cache.del(cacheKeys.cart(userId));
    await cache.del(cacheKeys.cartCount(userId));

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
