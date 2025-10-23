import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    let token = authHeader?.replace('Bearer ', '');
    
    // Fallback to cookies
    if (!token) {
      token = req.cookies['auth-token'] || 
              req.cookies['userToken'] || 
              req.cookies['hh_token'];
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    const sellerId = decoded.userId || decoded.id;

    await dbConnect();

    // Get actual low stock products from database
    const lowStockProducts = await Product.find({
      farmerId: sellerId,
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    }).select('name stock lowStockAlert unit category createdAt').lean();

    // Map to the expected format
    const formattedProducts = lowStockProducts.map((product: any) => ({
      _id: product._id?.toString() || '',
      name: product.name,
      sku: `${product.category?.slice(0, 3).toUpperCase()}-${product._id?.toString().slice(-4) || '0000'}`,
      currentStock: product.stock,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert || 5,
      category: product.category,
      unit: product.unit || 'kg'
    }));

    res.status(200).json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}