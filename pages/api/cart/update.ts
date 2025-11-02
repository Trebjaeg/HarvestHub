import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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
      .select('stock isActive unit inventory_available inventory_on_hand')
      .lean()
      .exec();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is still active
    if (!(product as any).isActive) {
      return res.status(400).json({ error: 'Product is no longer available' });
    }

    // Calculate real-time available stock
    const availableStock = (product as any).inventory_available ?? (product as any).stock;

    // Check if requested quantity exceeds available stock
    if (quantity > availableStock) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        message: `Only ${availableStock} ${(product as any).unit} available in stock`,
        availableStock: availableStock
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // Get updated cart count
    const totalCount = await CartItem.countDocuments({ userId }).maxTimeMS(1000);

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cartItem,
      count: totalCount
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
