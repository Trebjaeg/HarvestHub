import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';
import { cache, cacheKeys } from '@/lib/redis';

interface DecodedToken {
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

    // Get token from cookies
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const userId = decoded.userId;

    const { itemId, quantity } = req.body;

    if (!itemId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Find the cart item
    const cartItem = await CartItem.findOne({
      _id: itemId,
      userId: userId
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Get product to check stock
    const product = await Product.findById(cartItem.productId)
      .select('stock isActive unit')
      .lean()
      .exec();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is still active
    if (!product.isActive) {
      return res.status(400).json({ error: 'Product is no longer available' });
    }

    // Check if requested quantity exceeds stock
    if (quantity > product.stock) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        message: `Only ${product.stock} ${product.unit} available in stock`,
        availableStock: product.stock
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // Invalidate cart cache
    await cache.del(cacheKeys.cart(userId));

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cartItem
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
