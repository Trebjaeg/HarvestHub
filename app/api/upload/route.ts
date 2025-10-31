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
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 30MB after compression)
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 30MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to DigitalOcean Spaces
    const imageUrl = await uploadToSpaces(buffer, fileName, file.type);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
