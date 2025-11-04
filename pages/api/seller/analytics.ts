import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      token = req.cookies['auth-token'] || 
              req.cookies['userToken'] || 
              req.cookies['hh_token'] ||
              req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token - user ID not found' });
    }

    // Get user/seller data
    const seller = await User.findById(userId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (seller.role !== 'seller' && seller.role !== 'admin' && seller.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Seller role required.' });
    }

    // Get query parameters for filtering
    const { period = '30', category, status } = req.query;

    // Get detailed analytics
    const analytics = await getDetailedAnalytics(userId, {
      period: parseInt(period as string),
      category: category as string,
      status: status as string
    });

    return res.status(200).json({
      success: true,
      ...analytics
    });

  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function getDetailedAnalytics(sellerId: string, filters: {
  period: number;
  category?: string;
  status?: string;
}) {
  try {
    const { period, status } = filters;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Build order query
    const orderQuery: {
      sellerId: string;
      orderDate: { $gte: Date; $lte: Date };
      status?: string;
    } = {
      sellerId,
      orderDate: { $gte: startDate, $lte: endDate }
    };

    if (status && status !== 'all') {
      orderQuery.status = status;
    }

    // Get orders in the specified period
    const orders = await Order.find(orderQuery).lean();

    // Sales Trends (daily breakdown)
    const dailyStats = await Order.aggregate([
      {
        $match: orderQuery
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' }
          },
          revenue: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Product performance
    const productPerformance = await Order.aggregate([
      {
        $match: {
          ...orderQuery,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          productName: { $first: '$products.productName' },
          totalSold: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
          avgPrice: { $avg: '$products.price' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Customer analytics
    const customerAnalytics = await Order.aggregate([
      {
        $match: orderQuery
      },
      {
        $group: {
          _id: '$buyerId',
          buyerName: { $first: '$buyerName' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$finalAmount' },
          avgOrderValue: { $avg: '$finalAmount' },
          lastOrderDate: { $max: '$orderDate' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Conversion funnel
    const conversionFunnel = await Order.aggregate([
      {
        $match: { sellerId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Geographic distribution
    const geoDistribution = await Order.aggregate([
      {
        $match: orderQuery
      },
      {
        $group: {
          _id: '$deliveryAddress.city',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    // Payment method breakdown
    const paymentMethods = await Order.aggregate([
      {
        $match: orderQuery
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate summary metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Growth comparison (previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - period);
    
    const previousOrders = await Order.find({
      sellerId,
      orderDate: { $gte: previousStartDate, $lt: startDate }
    }).lean();

    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const orderGrowth = previousOrders.length > 0 ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 : 0;

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100
      },
      dailyStats,
      productPerformance,
      customerAnalytics,
      conversionFunnel,
      geoDistribution,
      paymentMethods,
      period: {
        days: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };

  } catch (error) {
    console.error('Error calculating detailed analytics:', error);
    throw error;
  }
}