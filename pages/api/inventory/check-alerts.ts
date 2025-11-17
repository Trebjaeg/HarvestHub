import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { notifyLowStock } from '@/lib/notification-utils';
import Notification from '@/models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Find all products with low stock
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    }).select('name stock lowStockAlert unit farmerId _id').lean();

    let notificationsSent = 0;

    for (const product of lowStockProducts) {
      // Check if we already sent a notification for this stock level in the last 24 hours
      const recentAlert = await Notification.findOne({
        userId: product.farmerId,
        type: 'low_stock_alert',
        'metadata.productId': product._id.toString(),
        'metadata.currentStock': product.stock,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).lean();

      if (!recentAlert) {
        await notifyLowStock(
          product.farmerId,
          product.name,
          product._id.toString(),
          product.stock,
          product.lowStockAlert || 5,
          product.unit || 'pcs'
        );
        notificationsSent++;
      }
    }

    res.status(200).json({
      message: 'Low stock alerts checked successfully',
      productsChecked: lowStockProducts.length,
      notificationsSent
    });
  } catch (error) {
    console.error('Error checking low stock alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}