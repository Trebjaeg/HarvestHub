import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { uploadToSpaces, deleteFromSpaces } from '../../../../lib/digitalocean-spaces';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

// Disable body parsing for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * @route POST /api/admin/banners/upload
 * @desc Upload banner image to DigitalOcean Spaces
 * @access Private (Admin only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB max
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const uploadedFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!uploadedFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(uploadedFile.mimetype || '')) {
      return res.status(400).json({
        message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
      });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = uploadedFile.originalFilename || 'banner';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `banners/banner_${timestamp}_${sanitizedName}`;

    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadToSpaces(fileBuffer, fileName, uploadedFile.mimetype || 'image/jpeg');

    // Delete temp file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
      },
    });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
