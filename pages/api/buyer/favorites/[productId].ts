import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Favorite from '../../../../models/Favorite';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: string;
  email?: string;
}

interface FavoriteDoc {
  _id: Types.ObjectId;
  buyerId: string;
  productId: string;
  isActive: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Connect to database
    await dbConnect();

    // Check if product is in favorites
    const favorite = await Favorite.findOne({ 
      buyerId, 
      productId, 
      isActive: true 
    }).select('_id').lean<FavoriteDoc>();

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite ? favorite._id.toString() : null,
        productId
      }
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    
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
        message: error instanceof Error ? error.message : 'Unknown error'
      } : undefined
    });
  }
}