import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get a sample of orders to check structure
    const sampleOrders = await Order.find({
      status: { $in: ['delivered', 'completed'] },
      paymentStatus: 'paid'
    })
    .limit(5)
    .select('sellerId products orderDate')
    .lean();

    // Count total orders by seller
    const orderCounts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$sellerId',
          totalOrders: { $sum: 1 },
          totalProducts: { $sum: { $size: '$products' } }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      message: 'Database check successful',
      totalCompletedOrders: await Order.countDocuments({
        status: { $in: ['delivered', 'completed'] },
        paymentStatus: 'paid'
      }),
      sampleOrders,
      topSellersByOrders: orderCounts,
      databaseConnected: true
    });

  } catch (error) {
    console.error('Database check error:', error);
    res.status(500).json({ 
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConnected: false
    });
  }
}