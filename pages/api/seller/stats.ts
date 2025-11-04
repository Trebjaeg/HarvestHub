import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
}

interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

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

    // Fallback to cookies (check all possible cookie names)
    if (!token) {
      token = req.cookies['auth-token'] || req.cookies.token || req.cookies.userToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token: no user ID found' });
    }

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
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function getSellerStats(sellerId: string) {
  try {
    // Get current date for time-based calculations
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total products listed by this seller
    const totalProducts = await Product.countDocuments({
      farmerId: sellerId,
      isActive: true
    });

    // Get low stock products (stock <= 5 or stock <= lowStockAlert)
    const lowStockProducts = await Product.countDocuments({
      farmerId: sellerId,
      isActive: true,
      $or: [
        { stock: { $lte: 5 } },
        { $expr: { $lte: ["$stock", "$lowStockAlert"] } }
      ]
    });

    // Calculate average rating from products
    const products = await Product.find({
      farmerId: sellerId,
      isActive: true
    }).select('rating reviews productName stock totalSold');

    let totalRating = 0;
    let productsWithRatings = 0;

    products.forEach(product => {
      if (product.rating && product.rating > 0) {
        totalRating += product.rating;
        productsWithRatings++;
      }
    });

    // Calculate average rating - if no ratings exist, show 0.0
    const averageRating = productsWithRatings > 0 ? 
      parseFloat((totalRating / productsWithRatings).toFixed(1)) : 0.0;

    // Get all orders for this seller
    const allOrders = await Order.find({ 
      sellerId,
      status: { $ne: 'cancelled' }
    });
    
    // Get completed orders for revenue calculation
    const completedOrders = allOrders.filter(order => 
      order.status === 'completed' || order.status === 'delivered'
    );
    
    const totalRevenue = completedOrders.reduce((sum, order) => 
      sum + (order.finalAmount || order.totalAmount || 0), 0
    );

    // Calculate this month's revenue and orders
    const thisMonthOrders = completedOrders.filter(order => 
      new Date(order.createdAt) >= currentMonth
    );
    
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => 
      sum + (order.finalAmount || order.totalAmount || 0), 0
    );

    // Get detailed order counts by status
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const preparingOrders = allOrders.filter(o => o.status === 'preparing').length;
    const orderShipped = allOrders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered').length;
    const completedOrdersCount = allOrders.filter(o => o.status === 'completed').length;

    // Calculate monthly revenue for last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthRevenue = monthOrders.reduce((sum, order) => 
        sum + (order.finalAmount || order.totalAmount || 0), 0
      );
      
      monthlyRevenue.push({
        _id: { year: monthStart.getFullYear(), month: monthStart.getMonth() + 1 },
        revenue: Math.round(monthRevenue * 100) / 100,
        orderCount: monthOrders.length
      });
    }

    // Calculate top products based on sales
    const productSales = new Map();
    
    completedOrders.forEach(order => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((product: OrderProduct) => {
          const productId = product.productId;
          const productName = product.productName || 'Unknown Product';
          const quantity = product.quantity || 0;
          const price = product.price || 0;
          
          if (productSales.has(productId)) {
            const existing = productSales.get(productId);
            existing.totalSold += quantity;
            existing.totalRevenue += quantity * price;
          } else {
            productSales.set(productId, {
              _id: productId,
              productName,
              totalSold: quantity,
              totalRevenue: quantity * price
            });
          }
        });
      }
    });

    // Convert to array and sort by total sold
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)
      .map(product => ({
        ...product,
        totalRevenue: Math.round(product.totalRevenue * 100) / 100
      }));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: completedOrders.length,
      totalProducts,
      averageRating,
      pendingOrders,
      orderShipped,
      lowStockProducts,
      // Add the overview structure that the frontend expects
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: completedOrders.length,
        totalProducts,
        averageRating
      },
      orderStats: {
        pending: pendingOrders,
        preparing: preparingOrders,
        shipped: orderShipped,
        delivered: deliveredOrders,
        completed: completedOrdersCount
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      recentActivity: {
        recentOrders: thisMonthOrders.length,
        recentRevenue: Math.round(thisMonthRevenue * 100) / 100
      },
      topProducts,
      monthlyRevenue
    };

  } catch (error) {
    console.error('Error calculating seller stats:', error);
    throw error;
  }
}