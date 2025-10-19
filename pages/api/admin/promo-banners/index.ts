import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';
import { verifyAdminAuth } from '@/lib/admin-auth-server';

/**
 * @route GET /api/admin/promo-banners
 * @desc Get all promo banners (admin)
 * @access Private (Admin only)
 * 
 * @route POST /api/admin/promo-banners
 * @desc Create new promo banner
 * @access Private (Admin only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    await dbConnect();

    if (req.method === 'GET') {
      // Get all banners (including inactive)
      const banners = await PromoBanner.find({})
        .sort({ position: 1, createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        banners,
      });
    }

    if (req.method === 'POST') {
      const {
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        imageUrl,
        backgroundColor,
        textColor,
        isActive,
        position,
        showButton,
        startDate,
        endDate,
      } = req.body;

      // Validate required fields
      if (!title || !subtitle || !description || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, subtitle, description, imageUrl',
        });
      }

      // Create new banner
      const banner = await PromoBanner.create({
        title,
        subtitle,
        description,
        buttonText: buttonText || 'Shop now',
        buttonLink,
        imageUrl,
        backgroundColor: backgroundColor || '#DCFCE7',
        textColor: textColor || '#1E3A2F',
        isActive: isActive !== undefined ? isActive : true,
        position: position || 0,
        showButton: showButton !== undefined ? showButton : true,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        createdBy: adminUser.email,
      });

      return res.status(201).json({
        success: true,
        banner,
        message: 'Promo banner created successfully',
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in promo banners handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
