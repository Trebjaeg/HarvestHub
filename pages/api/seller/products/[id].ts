import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { deleteFromSpaces } from '../../../../lib/digitalocean-spaces';
import { generateSKU, isSKUUnique } from '@/lib/sku-generator';

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
    
    // Check if user is suspended - sellers cannot edit products when suspended
    const user = await User.findById(decoded.userId).select('status');
    if (user?.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        code: 'SUSPENDED',
        message: 'Your account is suspended and you cannot edit products. You can view your account but selling is disabled. Please submit an appeal to request account restoration.',
        canAppeal: true,
        appealUrl: '/appeals/new'
      });
    }
    
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
      sku
    } = req.body;

    // Handle SKU update if provided
    let productSKU = sku?.trim().toUpperCase();
    if (productSKU) {
      // Validate custom SKU uniqueness (excluding current product)
      const isUnique = await isSKUUnique(productSKU, id as string);
      if (!isUnique) {
        return res.status(400).json({
          error: 'SKU already exists',
          message: 'This SKU is already in use by another product. Please use a different SKU.'
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(category && { category }),
      ...(status && { status }),
      ...(unit && { unit }),
      ...(images && { 
        image: images[0],
        images 
      }),
      ...(harvestDate && { harvestDate: new Date(harvestDate) }),
      ...(productSKU && { sku: productSKU }),
      updatedAt: new Date()
    };

    // If stock is being updated, update all inventory fields
    if (stock !== undefined) {
      const stockValue = parseInt(stock);
      const existingProduct = await Product.findById(id).select('inventory_reserved inventory_committed');
      const reserved = existingProduct?.inventory_reserved || 0;
      const committed = existingProduct?.inventory_committed || 0;
      
      updateData.stock = stockValue;
      updateData.inventory_on_hand = stockValue;
      updateData.inventory_available = Math.max(0, stockValue - reserved - committed);
    }

    // Find and update product
    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        farmerId: decoded.userId
      },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Invalidate product list cache to ensure updates show immediately
    try {
      const memoryCache = (await import('../../../../lib/memory-cache')).default;
      const { cache } = await import('../../../../lib/redis');
      
      // Clear all product list caches
      memoryCache.clear('products:');
      await cache.del('products:*');
      console.log('✅ Product cache cleared after update');
    } catch (cacheError) {
      console.log('⚠️ Failed to clear cache, but product was updated:', cacheError);
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
    
    // Check if user is suspended - sellers cannot delete products when suspended
    const user = await User.findById(decoded.userId).select('status');
    if (user?.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        code: 'SUSPENDED',
        message: 'Your account is suspended and you cannot delete products. You can view your account but selling is disabled. Please submit an appeal to request account restoration.',
        canAppeal: true,
        appealUrl: '/appeals/new'
      });
    }
    
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

    // Invalidate product list cache to ensure deletion reflects immediately
    try {
      const memoryCache = (await import('../../../../lib/memory-cache')).default;
      const { cache } = await import('../../../../lib/redis');
      
      // Clear all product list caches
      memoryCache.clear('products:');
      await cache.del('products:*');
      console.log('✅ Product cache cleared after deletion');
    } catch (cacheError) {
      console.log('⚠️ Failed to clear cache, but product was deleted:', cacheError);
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