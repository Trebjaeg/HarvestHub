import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';
import { applyRateLimit, getRateLimitHeaders } from '@/lib/app-rate-limiter';

export const config = {
  api: {
    bodyParser: false,
  },
};

// POST /api/upload - Upload images to DigitalOcean Spaces
export async function POST(request: NextRequest) {
  // Apply stricter rate limiting for uploads: 20 uploads per 15 minutes
  const rateLimitResponse = await applyRateLimit(request, {
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const folder = formData.get('folder') as string || 'general';
    
    // Get all files (supports both single 'file' and multiple 'images')
    const files: File[] = [];
    const singleFile = formData.get('file') as File;
    const multipleFiles = formData.getAll('images') as File[];
    
    if (singleFile) {
      files.push(singleFile);
    }
    if (multipleFiles && multipleFiles.length > 0) {
      files.push(...multipleFiles);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Upload all files
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      // Validate file type (allow common images and HEIC/HEIF by extension)
      const lowerName = (file.name || '').toLowerCase();
      const looksLikeHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
      if (!(file.type?.startsWith('image/') || looksLikeHeic)) {
        return NextResponse.json(
          { error: 'Only image files are allowed (jpg/png/webp/heic/heif)' },
          { status: 400 }
        );
      }

      // Validate file size (max 60MB per image server-side)
      if (file.size > 60 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Each file must be less than 60MB' },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to DigitalOcean Spaces
      const imageUrl = await uploadToSpaces(buffer, fileName, file.type, folder);
      uploadedUrls.push(imageUrl);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0], // For backward compatibility with single file uploads
      urls: uploadedUrls, // For multiple file uploads
      message: `${uploadedUrls.length} file(s) uploaded successfully`
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
