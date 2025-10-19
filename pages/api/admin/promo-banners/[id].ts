import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';
import { verifyAdminAuth } from '@/lib/admin-auth-server';

/**
 * @route GET /api/admin/promo-banners/[id]
 * @desc Get single promo banner
 * @access Private (Admin only)
 * 
 * @route PUT /api/admin/promo-banners/[id]
 * @desc Update promo banner
 * @access Private (Admin only)
 * 
 * @route DELETE /api/admin/promo-banners/[id]
 * @desc Delete promo banner
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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Banner ID is required' });
    }

    if (req.method === 'GET') {
      const banner = await PromoBanner.findById(id);

      if (!banner) {
        return res.status(404).json({ message: 'Promo banner not found' });
      }

      return res.status(200).json({
        success: true,
        banner,
      });
    }

    if (req.method === 'PUT') {
      const updateData = req.body;

      // Validate dates if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const banner = await PromoBanner.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!banner) {
        return res.status(404).json({ message: 'Promo banner not found' });
      }

      return res.status(200).json({
        success: true,
        banner,
        message: 'Promo banner updated successfully',
      });
    }

    if (req.method === 'DELETE') {
      const banner = await PromoBanner.findByIdAndDelete(id);

      if (!banner) {
        return res.status(404).json({ message: 'Promo banner not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Promo banner deleted successfully',
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in promo banner handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
