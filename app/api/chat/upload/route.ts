import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';
import { v4 as uuidv4 } from 'uuid';

// Configure route for large file uploads (App Router syntax)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

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

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('📤 Chat upload API called');
  
  // Add CORS headers for production
  const origin = request.headers.get('origin') || '';
  
  try {
    // Verify authentication with detailed logging
    const authResult = await verifyToken(request);
    
    // Check for auth cookies for debugging
    const cookies = request.cookies.getAll();
    const hasCookie = cookies.some(c => c.name.includes('auth') || c.name.includes('token'));
    
    console.log('🔐 Chat upload auth check:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      userId: authResult.user?.id,
      userRole: authResult.user?.role,
      error: authResult.error,
      hasCookie,
      cookieNames: cookies.map(c => c.name)
    });
    
    if (!authResult.success || !authResult.user) {
      console.error('❌ Chat upload: Unauthorized attempt', {
        error: authResult.error,
        hasAuthResult: !!authResult,
        hasCookie,
        headers: {
          authorization: request.headers.get('authorization') ? 'present' : 'missing',
          cookie: request.headers.get('cookie') ? 'present' : 'missing'
        }
      });
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authResult.error || 'Please log in to upload files',
        debug: process.env.NODE_ENV === 'development' ? {
          hasCookie,
          authError: authResult.error
        } : undefined
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    const userId = authResult.user.id;
    console.log('✅ Chat upload: User authenticated successfully', { userId, role: authResult.user.role });
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    // Additional check by file extension (iOS sometimes reports wrong MIME type for MOV)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isVideoByExtension = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExtension || '');
    const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
    const isDocumentByExtension = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(fileExtension || '');

    // Validate file type (check MIME type OR file extension)
    if (!ALL_ALLOWED_TYPES.includes(file.type) && !isVideoByExtension && !isImageByExtension && !isDocumentByExtension) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed types: Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM, MOV), and Documents (PDF, Word, Excel, Text)' 
        },
        { status: 400 }
      );
    }

    // Validate file size based on type (check MIME type OR file extension)
    let maxSize = MAX_DOCUMENT_SIZE;
    let sizeLabel = '10MB';
    
    if (isImage || isImageByExtension) {
      maxSize = MAX_IMAGE_SIZE;
      sizeLabel = '10MB';
    } else if (isVideo || isVideoByExtension) {
      maxSize = MAX_VIDEO_SIZE;
      sizeLabel = '100MB';
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large. Maximum size for ${(isVideo || isVideoByExtension) ? 'videos' : (isImage || isImageByExtension) ? 'images' : 'documents'} is ${sizeLabel}.` },
        { status: 400 }
      );
    }

    // Generate unique filename (reuse fileExtension from earlier)
    const uniqueFileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine correct content type (fix wrong MIME types from iOS)
    let contentType = file.type || 'application/octet-stream';
    if (!file.type || file.type === 'application/octet-stream') {
      // Set correct content type based on extension
      if (fileExtension === 'mov') contentType = 'video/quicktime';
      else if (fileExtension === 'mp4') contentType = 'video/mp4';
      else if (fileExtension === 'webm') contentType = 'video/webm';
      else if (fileExtension === 'avi') contentType = 'video/x-msvideo';
      else if (fileExtension === 'mkv') contentType = 'video/x-matroska';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') contentType = 'image/jpeg';
      else if (fileExtension === 'png') contentType = 'image/png';
      else if (fileExtension === 'gif') contentType = 'image/gif';
      else if (fileExtension === 'webp') contentType = 'image/webp';
      else if (fileExtension === 'pdf') contentType = 'application/pdf';
    }

    // Upload to DigitalOcean Spaces
    const fileUrl = await uploadToSpaces(buffer, uniqueFileName, contentType, 'chat');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Determine file category (use MIME type OR file extension)
    let fileCategory: 'image' | 'video' | 'document' = 'document';
    if (isImage || isImageByExtension) fileCategory = 'image';
    else if (isVideo || isVideoByExtension) fileCategory = 'video';

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
    }, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error uploading chat file:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}