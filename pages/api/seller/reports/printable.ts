import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId?: string; id?: string };
    const sellerId = decoded.userId || decoded.id;

    await dbConnect();

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Convert dates to proper format
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log('Generating printable report for seller:', sellerId);
    console.log('Date range:', start, 'to', end);

    // Get all orders for the seller in the date range (try both formats)
    let orders = await Order.find({
      sellerId: sellerId,
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).lean();

    console.log('Found orders with string sellerId:', orders.length);
    
    // If no orders found, also try with ObjectId conversion
    if (orders.length === 0) {
      console.log('No orders found with string, trying with ObjectId sellerId...');
      orders = await Order.find({
        sellerId: new ObjectId(sellerId),
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).lean();
      console.log('Found orders with ObjectId sellerId:', orders.length);
    }

    // Calculate summary statistics
    let totalRevenue = 0;
    const totalOrders = orders.length;
    let totalProductsSold = 0;
    const productSales: { [key: string]: { name: string; sold: number; revenue: number } } = {};

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      
      order.products.forEach(item => {
        totalProductsSold += item.quantity;
        
        const productKey = item.productId.toString();
        if (!productSales[productKey]) {
          productSales[productKey] = {
            name: item.productName,
            sold: 0,
            revenue: 0
          };
        }
        
        productSales[productKey].sold += item.quantity;
        productSales[productKey].revenue += item.quantity * item.price;
      });
    });

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling products (sorted by revenue)
    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        _id: productId,
        name: data.name,
        totalSold: data.sold,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Generate daily stats for the period
    const dailyStats = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      dailyStats.push({
        date: currentDate.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenue: dayRevenue
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const reportData = {
      totalRevenue,
      totalOrders,
      totalProducts: totalProductsSold,
      averageOrderValue,
      topProducts,
      dailyStats,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };

    console.log('Report data generated:', {
      totalRevenue,
      totalOrders,
      totalProducts: totalProductsSold,
      topProductsCount: topProducts.length
    });

    res.status(200).json(reportData);

  } catch (error) {
    console.error('Error generating printable report:', error);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}