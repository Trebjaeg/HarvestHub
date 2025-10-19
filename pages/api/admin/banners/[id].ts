import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/mongodb';
import Banner from '../../../../models/Banner';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

/**
 * @route GET /api/admin/banners/[id]
 * @desc Get single banner
 * @access Private (Admin only)
 * 
 * @route PUT /api/admin/banners/[id]
 * @desc Update banner
 * @access Private (Admin only)
 * 
 * @route DELETE /api/admin/banners/[id]
 * @desc Delete banner
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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }

    switch (req.method) {
      case 'GET':
        return await getBanner(id, res);
      case 'PUT':
        return await updateBanner(id, req, res);
      case 'DELETE':
        return await deleteBanner(id, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in banner API:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// GET single banner
async function getBanner(id: string, res: NextApiResponse) {
  try {
    const banner = await Banner.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching banner',
    });
  }
}

// PUT update banner
async function updateBanner(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse
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

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    // Update fields
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (position !== undefined) banner.position = position;
    if (isActive !== undefined) banner.isActive = isActive;
    if (startDate !== undefined) banner.startDate = startDate;
    if (endDate !== undefined) banner.endDate = endDate;
    if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor;
    if (textColor !== undefined) banner.textColor = textColor;

    await banner.save();

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating banner',
    });
  }
}

// DELETE banner
async function deleteBanner(id: string, res: NextApiResponse) {
  try {
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    await banner.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting banner',
    });
  }
}
