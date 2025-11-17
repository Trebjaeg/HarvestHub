import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

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

    // Get ALL orders for this seller
    const allOrders = await Order.find({
      sellerId: sellerId.toString(),
      status: { $in: ['delivered', 'completed'] },
      paymentStatus: 'paid'
    }).select('products orderDate').lean();

    // Calculate raw sales data
    const rawSalesData: Record<string, any> = {};
    
    allOrders.forEach(order => {
      order.products.forEach(item => {
        const productId = item.productId;
        if (!rawSalesData[productId]) {
          rawSalesData[productId] = {
            productId,
            productName: item.productName,
            totalSold: 0,
            totalRevenue: 0,
            orderCount: 0,
            orders: []
          };
        }
        
        rawSalesData[productId].totalSold += item.quantity;
        rawSalesData[productId].totalRevenue += (item.price * item.quantity);
        rawSalesData[productId].orderCount++;
        rawSalesData[productId].orders.push({
          orderDate: order.orderDate,
          quantity: item.quantity,
          price: item.price,
          revenue: item.price * item.quantity
        });
      });
    });

    // Sort by total sold
    const sortedByTotalSold = Object.values(rawSalesData)
      .sort((a: any, b: any) => b.totalSold - a.totalSold);

    // Sort by total revenue
    const sortedByRevenue = Object.values(rawSalesData)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Get product names for better readability
    const productIds = Object.keys(rawSalesData);
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('name category').lean();

    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {} as Record<string, any>);

    // Enhance data with product names
    const enhancedData = Object.values(rawSalesData).map((data: any) => {
      const product = productMap[data.productId];
      return {
        ...data,
        actualProductName: product?.name || data.productName,
        category: product?.category
      };
    });

    res.status(200).json({
      message: 'Best sellers debug data',
      sellerId,
      totalOrders: allOrders.length,
      totalProductsWithSales: Object.keys(rawSalesData).length,
      topByTotalSold: sortedByTotalSold.slice(0, 10).map((item: any) => ({
        productName: productMap[item.productId]?.name || item.productName,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount
      })),
      topByRevenue: sortedByRevenue.slice(0, 10).map((item: any) => ({
        productName: productMap[item.productId]?.name || item.productName,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount
      })),
      allProductSales: enhancedData.sort((a: any, b: any) => b.totalSold - a.totalSold)
    });

  } catch (error) {
    console.error('Error in best sellers debug:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}