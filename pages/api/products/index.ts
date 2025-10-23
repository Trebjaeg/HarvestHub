import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import { withSecurity, withLogging } from '@/lib/middleware';

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
      sortBy
    } = req.query;

    const query: any = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (farmerId) query.farmerId = farmerId;
    if (search) {
      query.$text = { $search: search as string };
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
      .exec();

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      products: products, // Changed from 'data' to 'products' for consistency with TopProducts component
      data: products, // Keep 'data' for backward compatibility
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: products.length,
        totalItems: total
      }
    });
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