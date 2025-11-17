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

    // Get actual low stock products using aggregation pipeline for better type handling
    const lowStockProducts = await Product.aggregate([
      {
        $match: {
          farmerId: sellerId.toString(), // Ensure string comparison
          isActive: true
        }
      },
      {
        $addFields: {
          // Convert to numbers and set default lowStockAlert if not set
          stockNum: { $toDouble: { $ifNull: ["$stock", 0] } },
          alertNum: { $toDouble: { $ifNull: ["$lowStockAlert", 5] } }
        }
      },
      {
        $match: {
          $expr: { $lte: ["$stockNum", "$alertNum"] }
        }
      },
      {
        $project: {
          name: 1,
          stock: 1,
          lowStockAlert: 1,
          unit: 1,
          category: 1,
          createdAt: 1
        }
      }
    ]);



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



    // Also check for alerts when fetching products
    try {
      const { checkLowStockAlerts } = await import('../../../models/Product');
      await checkLowStockAlerts(sellerId.toString());
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
      // Don't fail the request if alert checking fails
    }

    res.status(200).json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}