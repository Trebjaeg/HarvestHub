import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Get token from header or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['hh_token'] || req.cookies['auth-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      return handleGET(req, res, decoded.userId);
    } else if (req.method === 'POST') {
      return handlePOST(req, res, decoded.userId, user);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { search, category, status, page = '1', limit = '12' } = req.query;

    // Build query
    const query: any = { farmerId: userId };

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All' && typeof category === 'string') {
      query.category = category;
    }

    if (status && status !== 'All' && typeof status === 'string') {
      query.status = status;
    }

    // Get products with pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      products,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse, userId: string, user: any) {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('User ID:', userId);
    console.log('User Name:', user.name);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      description,
      price,
      category,
      status,
      unit,
      stock,
      images,
      harvestDate,
      lowStockAlert
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !unit || stock === undefined) {
      console.error('Validation failed - missing fields:', { name, price, category, unit, stock });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, price, category, unit, and stock are required'
      });
    }

    console.log('Creating product with data:', {
      name,
      price: parseFloat(price),
      category,
      unit,
      stock: parseInt(stock),
      images: images?.length || 0
    });

    // Create product
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      status: status || 'Available',
      unit,
      stock: parseInt(stock),
      lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 10,
      image: images?.[0] || '/images/products/default.png',
      images: images || [],
      farmerId: userId,
      farmerName: user.name,
      location: user.address,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      isActive: true,
      isOrganic: false,
      featured: false
    });

    await product.save();
    console.log('Product created successfully:', product._id);

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('!!! ERROR CREATING PRODUCT !!!');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    });
  }
}