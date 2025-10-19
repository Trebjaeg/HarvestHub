import { NextApiRequest, NextApiResponse } from 'next';
import { deleteFromSpaces } from '../../../../lib/digitalocean-spaces';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

/**
 * @route DELETE /api/admin/banners/delete-image
 * @desc Delete banner image from DigitalOcean Spaces
 * @access Private (Admin only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Extract key from URL
    // URL format: https://harvesthub.sgp1.digitaloceanspaces.com/banners/banner_123.jpg
    const key = imageUrl.split('.com/')[1];

    if (!key) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    // Delete from Spaces
    await deleteFromSpaces(key);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
