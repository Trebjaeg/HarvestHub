import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import { withSecurity, withLogging } from '@/lib/middleware';
import { cache, cacheKeys } from '@/lib/redis';

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
    const cacheKey = cacheKeys.products(
      JSON.stringify({ category, featured, farmerId, search, limit, page, sort, sortBy, minPrice, maxPrice })
    );

    // Try to get from cache first (with timeout protection)
    try {
      const cachedData = await Promise.race([
        cache.get(cacheKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 1000))
      ]);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
    } catch (cacheError) {
      console.log('Cache read skipped:', cacheError instanceof Error ? cacheError.message : 'unknown error');
      // Continue without cache
    }

    const query: any = { isActive: true };

    // Apply filters
    if (category) {
      // Handle special category filters that map to multiple DB categories
      if (category === 'vegetables') {
        // Show all vegetable-related categories
        query.category = { $in: ['Leafy Greens', 'Root Crops', 'Eggplant & Gourds'] };
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

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limitNum)
      .skip(skip)
      .select('-__v') // Exclude version field
      .lean() // Return plain JS objects for better performance
      .maxTimeMS(5000) // Add 5 second timeout for MongoDB query
      .exec();

    const total = await Product.countDocuments(query).maxTimeMS(5000);

    const responseData = {
      success: true,
      products: products, // Changed from 'data' to 'products' for consistency with TopProducts component
      data: products, // Keep 'data' for backward compatibility
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: products.length,
        totalItems: total
      }
    };

    // Cache the response for 5 minutes (300 seconds) - with timeout protection
    try {
      await Promise.race([
        cache.set(cacheKey, responseData, 300),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache write timeout')), 1000))
      ]);
    } catch (cacheError) {
      console.log('Cache write skipped:', cacheError instanceof Error ? cacheError.message : 'unknown error');
      // Continue without cache
    }

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch products' 
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

    // Invalidate product list caches
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

export default withSecurity(
  withLogging(productsHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET', 'POST'],
    cors: true
  }
);