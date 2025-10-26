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
    const product: any = await Product.findOne({ _id: id, isActive: true })
      .maxTimeMS(3000)
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get seller info and review stats in parallel for better performance
    const User = (await import('@/models/User')).default;
    const Review = (await import('@/models/Review')).default;
    const sellerId = product.sellerId || product.farmerId;
    
    // Simplified approach - get seller and basic review count
    const seller = sellerId ? await User.findById(sellerId)
      .select('name firstName lastName email profilePicture profileImage location accountStatus verified')
      .maxTimeMS(2000)
      .lean()
      .catch(() => null) : null;
    
    // Get product reviews - simplified
    const productReviews = await Review.find({ 
      productId: product._id, 
      status: 'approved' 
    })
      .select('rating')
      .maxTimeMS(2000)
      .lean()
      .catch(() => []);

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    productReviews.forEach((review: any) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
        totalRating += review.rating;
      }
    });

    const averageRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

    // Get seller rating - simplified (use product average or default)
    let sellerRating = averageRating;
    let sellerReviewCount = productReviews.length;

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        seller: seller ? {
          id: seller._id,
          name: seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim(),
          email: seller.email,
          profileImage: seller.profileImage || seller.profilePicture,
          location: seller.location || 'Philippines',
          isActive: seller.accountStatus === 'active',
          isSuspended: seller.accountStatus === 'suspended',
          isVerified: seller.verified || false,
          rating: sellerRating,
          reviewCount: sellerReviewCount,
          responseRate: 95,
          responseTime: '< 2h'
        } : null,
        ratings: {
          average: averageRating,
          total: productReviews.length,
          distribution
        }
      }
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