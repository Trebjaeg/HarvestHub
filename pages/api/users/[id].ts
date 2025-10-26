import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import { withSecurity, withLogging } from '@/lib/middleware';

async function userHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user ID' 
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user: any = await User.findById(id)
      .select('firstName lastName email role profileImage bannerImage verified followers following createdAt bio location')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is a seller, get additional stats
    let additionalData = {};
    if (user.role === 'seller' || user.role === 'farmer') {
      const productCount = await Product.countDocuments({ 
        sellerId: user._id,
        isActive: true 
      });

      // Calculate average rating (you can expand this with actual review data)
      const products = await Product.find({ sellerId: user._id }).select('rating reviewCount');
      const totalRatings = products.reduce((sum, p: any) => sum + (p.rating || 0) * (p.reviewCount || 0), 0);
      const totalReviews = products.reduce((sum, p: any) => sum + (p.reviewCount || 0), 0);
      const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

      additionalData = {
        rating: averageRating,
        totalRatings: totalReviews,
        totalProducts: productCount,
        responseRate: 95, // You can calculate this from actual message data
        responseTime: '< 2 hours',
        activeStatus: 'Active today'
      };
    }

    const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        verified: user.verified || false,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        memberSince,
        bio: user.bio,
        location: user.location,
        ...additionalData
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user information'
    });
  }
}

export default withLogging(withSecurity(userHandler));
