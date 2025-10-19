import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

/**
 * @route GET /api/promo-banners
 * @desc Get active promo banners
 * @access Public
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const now = new Date();

    // Get active banners that are within their date range (if specified)
    const banners = await PromoBanner.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false} },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
      ],
    })
      .sort({ position: 1, createdAt: -1 })
      .select('-createdBy -__v')
      .lean();

    return res.status(200).json({
      success: true,
      banners,
    });
  } catch (error) {
    console.error('Error fetching promo banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching promo banners',
    });
  }
}
