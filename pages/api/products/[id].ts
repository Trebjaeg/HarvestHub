import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { withSecurity, withLogging } from '@/lib/middleware';

async function productHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid product ID' 
    });
  }

  switch (req.method) {
    case 'GET':
      return await getProduct(req, res, id);
    case 'PUT':
      return await updateProduct(req, res, id);
    case 'DELETE':
      return await deleteProduct(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const product = await Product.findOne({ _id: id, isActive: true }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
}

async function updateProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const updateData = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
}

async function deleteProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
}

export default withSecurity(
  withLogging(productHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET', 'PUT', 'DELETE'],
    cors: true
  }
);