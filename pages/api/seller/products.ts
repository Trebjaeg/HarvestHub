import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { generateSKU, isSKUUnique } from '@/lib/sku-generator';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; status?: string };
    
    // Verify user exists and get status
    const user = await User.findById(decoded.userId).select('status role sellerStatus');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is deleted
    if (user.status === 'deleted') {
      return res.status(403).json({ error: 'Account not found' });
    }

    if (req.method === 'GET') {
      // GET requests allowed even when suspended (viewing products)
      return handleGET(req, res, decoded.userId);
    } else if (req.method === 'POST') {
      // POST requests (creating products) blocked when suspended
      if (user.status === 'suspended') {
        return res.status(403).json({ 
          error: 'Account suspended',
          code: 'SUSPENDED',
          message: 'Your account is suspended and you cannot list or sell products. You can view your account but selling is disabled. Please submit an appeal to request account restoration.',
          canAppeal: true,
          appealUrl: '/appeals/new'
        });
      }
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
      .limit(limitNum)
      .lean();

    // Transform products to include real-time available stock
    const transformedProducts = products.map(product => {
      // Calculate available stock (total - reserved - committed)
      const inventory_available = product.inventory_available ?? 
        (product.stock - (product.inventory_reserved || 0) - (product.inventory_committed || 0));
      
      return {
        ...product,
        inventory_available,
        inventory_reserved: product.inventory_reserved || 0,
        inventory_committed: product.inventory_committed || 0,
        inventory_on_hand: product.inventory_on_hand || product.stock
      };
    });

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      products: transformedProducts,
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
      lowStockAlert,
      sku
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !unit || stock === undefined) {
      console.error('Validation failed - missing fields:', { name, price, category, unit, stock });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, price, category, unit, and stock are required'
      });
    }

    // Handle SKU - either validate custom or generate new
    let productSKU = sku?.trim().toUpperCase() || '';
    
    try {
      if (productSKU) {
        // Validate custom SKU
        const isUnique = await isSKUUnique(productSKU);
        if (!isUnique) {
          return res.status(400).json({
            error: 'SKU already exists',
            message: 'This SKU is already in use. Please use a different SKU or enable auto-generation.'
          });
        }
      } else {
        // Auto-generate SKU
        productSKU = await generateSKU(category, userId);
      }
    } catch (skuError) {
      console.error('SKU generation error:', skuError);
      // Continue without SKU if generation fails
      productSKU = '';
    }

    console.log('Creating product with data:', {
      name,
      price: parseFloat(price),
      category,
      unit,
      stock: parseInt(stock),
      images: images?.length || 0,
      sku: productSKU,
      farmerId: userId,
      farmerName: user.name || user.firstName || 'Unknown Farmer',
      location: user.address || user.farmAddress || 'Unknown Location'
    });

    // Create product
    const stockValue = parseInt(stock);
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      status: status || 'Available',
      unit,
      stock: stockValue,
      inventory_on_hand: stockValue, // Set inventory fields
      inventory_available: stockValue, // Available = on_hand initially (no reservations)
      inventory_reserved: 0,
      inventory_committed: 0,
      lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 10,
      image: images?.[0] || '/images/products/default.png',
      images: images || [],
      farmerId: userId,
      farmerName: user.name || user.firstName || 'Unknown Farmer',
      location: user.address || user.farmAddress || 'Unknown Location',
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      ...(productSKU && { sku: productSKU }),
      isActive: true,
      isOrganic: false,
      featured: false
    });

    console.log('Attempting to save product to database...');
    await product.save();
    console.log('Product created successfully:', product._id);

    // Invalidate product list cache to ensure new product shows immediately
    try {
      const memoryCache = (await import('../../../lib/memory-cache')).default;
      const { cache, cacheKeys } = await import('../../../lib/redis');
      
      // Clear all product list caches (different filters/pages)
      memoryCache.clear();
      await cache.del('products:*');
      console.log('✅ Product cache cleared for real-time updates');
    } catch (cacheError) {
      console.log('⚠️ Failed to clear cache, but product was created:', cacheError);
    }

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