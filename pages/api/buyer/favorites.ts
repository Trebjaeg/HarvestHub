import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Favorite from '../../../models/Favorite';
import Product from '../../../models/Product';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: string;
  email?: string;
}

interface ProductDoc {
  _id: Types.ObjectId;
  name: string;
  price: number;
  images?: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  isActive: boolean;
}

interface FavoriteDoc {
  _id: Types.ObjectId;
  buyerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  productCategory: string;
  sellerId: string;
  sellerName: string;
  dateAdded: Date;
  isActive: boolean;
}

interface FilterQuery {
  buyerId: string;
  isActive: boolean;
  productCategory?: { $regex: string; $options: string };
  $or?: Array<{
    productName?: { $regex: string; $options: string };
    sellerName?: { $regex: string; $options: string };
    productCategory?: { $regex: string; $options: string };
  }>;
}

interface SortQuery {
  [key: string]: 1 | -1;
}

interface MongoError extends Error {
  code?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getFavorites(req, res);
  } else if (req.method === 'POST') {
    return addToFavorites(req, res);
  } else if (req.method === 'DELETE') {
    return removeFromFavorites(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function getFavorites(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract and verify JWT token from multiple sources
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    // Parse and validate query parameters
    const {
      page = '1',
      limit = '12',
      sortBy = 'dateAdded',
      sortOrder = 'desc',
      category,
      search
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: FilterQuery = { buyerId, isActive: true };

    // Add category filter
    if (category && category !== 'all') {
      filter.productCategory = { $regex: category as string, $options: 'i' };
    }

    // Add search filter
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      filter.$or = [
        { productName: { $regex: searchTerm, $options: 'i' } },
        { sellerName: { $regex: searchTerm, $options: 'i' } },
        { productCategory: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Build sort object with validation
    const validSortFields = ['dateAdded', 'productPrice', 'productName'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'dateAdded';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: SortQuery = { [sortField]: sortDirection };

    // Execute optimized queries in parallel
    const [favorites, totalFavorites] = await Promise.all([
      Favorite.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('productId productName productPrice productImage productCategory sellerId sellerName dateAdded isActive')
        .lean<FavoriteDoc[]>()
        .exec(),
      Favorite.countDocuments(filter).exec()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalFavorites / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Verify product availability and get updated information
    const productIds = favorites.map(fav => fav.productId);
    const activeProducts = await Product.find({ 
      _id: { $in: productIds }, 
      isActive: true 
    }).select('_id name price images category sellerId sellerName').lean<ProductDoc[]>();

    const activeProductMap = new Map(activeProducts.map(p => [p._id.toString(), p]));

    // Format favorites with updated product information
    const formattedFavorites = favorites.map(favorite => {
      const product = activeProductMap.get(favorite.productId);
      return {
        _id: favorite._id.toString(),
        productId: favorite.productId,
        productName: product?.name || favorite.productName,
        productPrice: product?.price || favorite.productPrice,
        productImage: product?.images?.[0] || favorite.productImage,
        productCategory: product?.category || favorite.productCategory,
        sellerId: product?.sellerId || favorite.sellerId,
        sellerName: product?.sellerName || favorite.sellerName,
        dateAdded: favorite.dateAdded.toISOString(),
        isAvailable: !!product,
        needsUpdate: !product || 
                     product.name !== favorite.productName || 
                     product.price !== favorite.productPrice
      };
    });

    // Enhanced response with metadata
    res.status(200).json({
      success: true,
      data: {
        favorites: formattedFavorites,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalFavorites,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
          startIndex: skip + 1,
          endIndex: Math.min(skip + limitNum, totalFavorites)
        },
        filters: {
          category: category || 'all',
          search: search || '',
          sortBy: sortField,
          sortOrder: sortOrder || 'desc'
        },
        meta: {
          timestamp: new Date().toISOString(),
          buyerId
        }
      }
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    });
  }
}

async function addToFavorites(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Connect to database
    await dbConnect();

    // Get product information
    const product = await Product.findById(productId).select('name price images category sellerId sellerName isActive').lean<ProductDoc>();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ success: false, message: 'Product is not available' });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ buyerId, productId });

    if (existingFavorite) {
      return res.status(409).json({ success: false, message: 'Product already in favorites' });
    }

    // Create new favorite
    const favorite = new Favorite({
      buyerId,
      productId,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images?.[0] || null,
      productCategory: product.category,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      isActive: true,
      dateAdded: new Date()
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: 'Product added to favorites',
      data: {
        favoriteId: favorite._id,
        productId: favorite.productId
      }
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    
    const mongoError = error as MongoError;
    if (mongoError.code === 11000) {
      return res.status(409).json({ success: false, message: 'Product already in favorites' });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to favorites',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}

async function removeFromFavorites(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Connect to database
    await dbConnect();

    // Remove from favorites
    const result = await Favorite.deleteOne({ buyerId, productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
      data: {
        productId
      }
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove from favorites',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}