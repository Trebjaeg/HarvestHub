import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';
import { v4 as uuidv4 } from 'uuid';

// Maximum file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB for documents

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska' // .mkv
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed types: Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM, MOV), and Documents (PDF, Word, Excel, Text)' 
        },
        { status: 400 }
      );
    }

    // Validate file size based on type
    let maxSize = MAX_DOCUMENT_SIZE;
    let sizeLabel = '10MB';
    
    if (isImage) {
      maxSize = MAX_IMAGE_SIZE;
      sizeLabel = '10MB';
    } else if (isVideo) {
      maxSize = MAX_VIDEO_SIZE;
      sizeLabel = '100MB';
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large. Maximum size for ${isVideo ? 'videos' : isImage ? 'images' : 'documents'} is ${sizeLabel}.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `chat/${userId}/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to DigitalOcean Spaces
    const fileUrl = await uploadToSpaces(buffer, uniqueFileName, file.type, 'chat');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Determine file category
    let fileCategory: 'image' | 'video' | 'document' = 'document';
    if (isImage) fileCategory = 'image';
    else if (isVideo) fileCategory = 'video';

    // Return file information
    const fileInfo = {
      id: uuidv4(),
      originalName: file.name,
      fileName: uniqueFileName,
      url: fileUrl,
      type: file.type,
      size: file.size,
      category: fileCategory,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}