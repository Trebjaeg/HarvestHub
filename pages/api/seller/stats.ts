import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
// import Order from '@/models/Order'; // Uncomment when Order functionality is ready

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

    // Fallback to cookies
    if (!token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;

    // Get user/seller data
    const seller = await User.findById(userId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get real statistics from database
    const stats = await getSellerStats(userId);

    return res.status(200).json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function getSellerStats(sellerId: string) {
  try {
    // Get total products listed by this seller
    const totalProducts = await Product.countDocuments({ 
      farmerId: sellerId,
      isActive: true 
    });

    // Get low stock products (stock <= lowStockAlert)
    const lowStockProducts = await Product.countDocuments({
      farmerId: sellerId,
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    });

    // Calculate average rating from products
    const products = await Product.find({ 
      farmerId: sellerId,
      isActive: true 
    }).select('rating reviews');

    let totalRating = 0;
    let totalReviews = 0;

    products.forEach(product => {
      if (product.rating && product.reviews) {
        totalRating += product.rating * product.reviews;
        totalReviews += product.reviews;
      }
    });

    const averageRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(1)) : 0;

    // TODO: Uncomment these when Order model is fully integrated
    // const totalOrders = await Order.countDocuments({ sellerId, status: { $ne: 'cancelled' } });
    // const completedOrders = await Order.find({ sellerId, status: 'completed' });
    // const totalRevenue = completedOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    // const pendingOrders = await Order.countDocuments({ sellerId, status: 'pending' });
    // const orderShipped = await Order.countDocuments({ sellerId, status: 'shipped' });
    
    const totalOrders = 0; 
    const totalRevenue = 0; 
    const pendingOrders = 0; 
    const orderShipped = 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      averageRating,
      pendingOrders,
      orderShipped,
      lowStockProducts
    };

  } catch (error) {
    console.error('Error calculating seller stats:', error);
    throw error;
  }
}