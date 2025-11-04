import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed types: Images (JPEG, PNG, GIF, WebP) and Documents (PDF, Word, Excel, Text)' 
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist, continue
    }

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, uniqueFileName);
    
    await writeFile(filePath, buffer);

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const fileCategory = isImage ? 'image' : 'document';

    // Return file information
    const fileInfo = {
      id: uuidv4(),
      originalName: file.name,
      fileName: uniqueFileName,
      url: `/uploads/chat/${uniqueFileName}`,
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