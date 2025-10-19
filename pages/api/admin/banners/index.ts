import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/mongodb';
import Banner from '../../../../models/Banner';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

/**
 * @route GET /api/admin/banners
 * @desc Get all banners (admin)
 * @access Private (Admin only)
 * 
 * @route POST /api/admin/banners
 * @desc Create a new banner
 * @access Private (Admin only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();

    // Verify admin authentication
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        return await getBanners(req, res);
      case 'POST':
        return await createBanner(req, res, adminUser.userId);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in banners API:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// GET all banners (admin view - includes inactive)
async function getBanners(req: NextApiRequest, res: NextApiResponse) {
  try {
    const banners = await Banner.find()
      .sort({ position: 1, createdAt: -1 })
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching banners',
    });
  }
}

// POST create new banner
async function createBanner(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      position,
      isActive,
      startDate,
      endDate,
      backgroundColor,
      textColor,
    } = req.body;

    // Validation
    if (!title || !subtitle || !buttonText || !buttonLink || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const newBanner = await Banner.create({
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      position: position || 0,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate,
      backgroundColor,
      textColor,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: newBanner,
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating banner',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
