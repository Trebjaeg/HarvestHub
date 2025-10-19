import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Banner from '../../../models/Banner';

/**
 * @route GET /api/banners
 * @desc Get all active banners
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
    await connectDB();

    const now = new Date();

    // Get active banners within date range (or no date restrictions)
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
      ],
    })
      .sort({ position: 1, createdAt: -1 })
      .select('-createdBy -__v')
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
