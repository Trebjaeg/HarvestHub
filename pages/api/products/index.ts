import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import { withSecurity, withLogging } from '@/lib/middleware';
import { cache, cacheKeys } from '@/lib/redis';
import { rateLimiter } from '@/lib/rate-limiter';
import memoryCache from '@/lib/memory-cache';

async function productsHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getProducts(req, res);
    case 'POST':
      return await createProduct(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getProducts(req: NextApiRequest, res: NextApiResponse) {
  // Variable to hold cached data throughout the function (must be outside try block)
  let cachedData: any = null;

  try {
    const {
      category,
      featured,
      farmerId,
      search,
      limit = '12', // Reduced from 20 for better performance
      page = '1',
      sort = 'createdAt',
      sortBy,
      minPrice,
      maxPrice
    } = req.query;

    // Build cache key from query parameters
    const cacheKey = `products:${JSON.stringify({ category, featured, farmerId, search, limit, page, sort, sortBy, minPrice, maxPrice })}`;

    // Try memory cache first (fastest - no network calls)
    cachedData = memoryCache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Try Redis cache as fallback (with timeout protection)
    try {
      const redisCachedData = await Promise.race([
        cache.get(cacheKeys.products(JSON.stringify({ category, featured, farmerId, search, limit, page, sort, sortBy, minPrice, maxPrice }))),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 2000))
      ]);
      if (redisCachedData) {
        // Store in memory cache for next time (30 seconds for real-time updates)
        memoryCache.set(cacheKey, redisCachedData, 30);
        cachedData = redisCachedData;
        return res.status(200).json(redisCachedData);
      }
    } catch (cacheError) {
      // Continue without cache
    }

    const query: any = { isActive: true };

    // Apply filters
    if (category) {
      // Handle special category filters that map to multiple DB categories
      if (category === 'vegetables') {
        // Show all vegetable-related categories
        query.category = { $in: ['Leafy Greens', 'Root Crops', 'Eggplant & Gourds'] };
      } else if (category === 'Grains & Rice') {
        // Handle both "Grains & Rice" and "Grains and Rice" variations
        query.category = { $in: ['Grains & Rice', 'Grains and Rice'] };
      } else {
        query.category = category;
      }
    }
    if (featured === 'true') query.featured = true;
    if (farmerId) query.farmerId = farmerId;
    if (search) {
      // Search in product name, description, and farmer name
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { farmerName: { $regex: searchRegex } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    const limitNum = Math.min(parseInt(limit as string), 50); // Max 50 items per page
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOption: any = {};
    
    // Handle sortBy parameter (for Top Products)
    if (sortBy === 'popular') {
      // Sort by products with discounts first, then by highest discount percentage
      query.$expr = {
        $and: [
          { $gt: ['$basePrice', '$currentPrice'] } // Has discount
        ]
      };
      sortOption = { 
        // Calculate discount percentage and sort by it
        discountPercentage: -1,
        createdAt: -1 
      };
    } else {
      // Regular sort options
      switch (sort) {
        case 'price_asc':
          sortOption = { price: 1 };
          break;
        case 'price_desc':
          sortOption = { price: -1 };
          break;
        case 'name':
          sortOption = { name: 1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    // Fetch products (without count for performance)
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limitNum)
      .skip(skip)
      .select('-__v') // Exclude version field
      .lean() // Return plain JS objects for better performance
      .maxTimeMS(30000) // 30 second timeout for MongoDB query
      .exec();

    // Map inventory_available to stock for backwards compatibility
    const productsWithStock = products.map(p => ({
      ...p,
      stock: p.inventory_available || p.stock || 0
    }));

    // Estimate total (don't run expensive count query)
    // Use a simple estimate based on results
    const estimatedTotal = products.length < limitNum ? skip + products.length : (pageNum + 1) * limitNum;

    const responseData = {
      success: true,
      products: productsWithStock, // Changed from 'data' to 'products' for consistency with TopProducts component
      data: productsWithStock, // Keep 'data' for backward compatibility
      pagination: {
        current: pageNum,
        total: Math.ceil(estimatedTotal / limitNum),
        count: products.length,
        totalItems: estimatedTotal,
        hasMore: products.length === limitNum
      }
    };

    // Cache the response in both memory (30 seconds) and Redis (30 seconds) for real-time updates
    memoryCache.set(cacheKey, responseData, 30);
    
    // Redis cache with timeout protection
    try {
      await Promise.race([
        cache.set(cacheKeys.products(JSON.stringify({ category, featured, farmerId, search, limit, page, sort, sortBy, minPrice, maxPrice })), responseData, 30),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache write timeout')), 3000))
      ]);
    } catch (cacheError) {
      // Continue without cache
    }

    return res.status(200).json(responseData);
  } catch (error: any) {
    // Return cached data if available on error
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch products',
      products: [],
      data: [],
      pagination: {
        current: 1,
        total: 1,
        count: 0,
        totalItems: 0,
        hasMore: false
      }
    });
  }
}

async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const productData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'category', 'price', 'unit', 'image', 'farmerId', 'farmerName', 'stock'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const product = new Product(productData);
    await product.save();

    // Invalidate both memory and Redis product caches
    memoryCache.delPattern('products:*');
    await cache.delPattern('products:*');

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
}

// Apply rate limiting: 200 requests per 15 minutes for product browsing
export default rateLimiter(
  withSecurity(
    withLogging(productsHandler),
    {
      rateLimit: 'general',
      allowedMethods: ['GET', 'POST'],
      cors: true
    }
  ),
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 min (generous for browsing)
  }
);