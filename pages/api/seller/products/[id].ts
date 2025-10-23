import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { deleteFromSpaces } from '../../../../lib/digitalocean-spaces';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return await handleGET(req, res, id as string);
  } else if (req.method === 'PUT') {
    return await handlePUT(req, res, id as string);
  } else if (req.method === 'DELETE') {
    return await handleDELETE(req, res, id as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    await dbConnect();

    // Get token from header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Check cookies
      token = req.cookies.hh_token || req.cookies['auth-token'] || req.cookies.userToken;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get product
    const product = await Product.findOne({
      _id: id,
      farmerId: decoded.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ product });

  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePUT(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    await dbConnect();

    // Get token from header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Check cookies
      token = req.cookies.hh_token || req.cookies['auth-token'] || req.cookies.userToken;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const {
      name,
      description,
      price,
      category,
      status,
      unit,
      stock,
      images,
      harvestDate
    } = req.body;

    // Find and update product
    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        farmerId: decoded.userId
      },
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(status && { status }),
        ...(unit && { unit }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(images && { 
          image: images[0],
          images 
        }),
        ...(harvestDate && { harvestDate: new Date(harvestDate) }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    await dbConnect();

    // Get token from header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Check cookies
      token = req.cookies.hh_token || req.cookies['auth-token'] || req.cookies.userToken;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Find product first to get image URLs before deletion
    const product = await Product.findOne({
      _id: id,
      farmerId: decoded.userId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Collect all image URLs to delete from Spaces
    const imagesToDelete: string[] = [];
    
    if (product.image && product.image !== '/images/products/default.png') {
      imagesToDelete.push(product.image);
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl: string) => {
        if (imageUrl && imageUrl !== '/images/products/default.png' && !imagesToDelete.includes(imageUrl)) {
          imagesToDelete.push(imageUrl);
        }
      });
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    // Delete images from DigitalOcean Spaces
    for (const imageUrl of imagesToDelete) {
      try {
        await deleteFromSpaces(imageUrl);
      } catch (error) {
        console.error('Error deleting image from Spaces:', error);
        // Continue with other deletions even if one fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}