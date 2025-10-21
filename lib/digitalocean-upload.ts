import AWS from 'aws-sdk';
import crypto from 'crypto';

// DigitalOcean Spaces configuration
const endpointUrl = process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
const spacesEndpoint = new AWS.Endpoint(endpointUrl.startsWith('https://') ? endpointUrl : `https://${endpointUrl}`);

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'harvesthub-storage';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}

interface FileValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Generate pre-signed URL for secure file upload
 * No client-side secrets exposed
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  folder: string = 'verification-documents'
): Promise<PresignedUploadUrl> => {
  try {
    // Check if credentials are configured
    if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
      throw new Error('DigitalOcean Spaces credentials not configured. Please set DO_SPACES_KEY and DO_SPACES_SECRET in environment variables.');
    }

    // Validate content type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new Error('Invalid file type. Only images and PDFs are allowed.');
    }

    // Generate unique key with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${randomString}-${sanitizedFileName}`;

    console.log('Generating pre-signed URL for key:', key);

    // Generate pre-signed URL (expires in 5 minutes)
    const uploadUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 300, // 5 minutes
      ACL: 'private', // Verification documents are private
    });

    console.log('Pre-signed URL generated successfully');

    return {
      uploadUrl,
      key,
    };
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    console.error('Error message:', error.message);
    throw new Error(error.message || 'Failed to generate upload URL');
  }
};

/**
 * Generate pre-signed URL for secure file download/viewing
 * Short-lived URLs for admin document preview
 */
export const generatePresignedDownloadUrl = async (
  key: string,
  expiresIn: number = 300 // 5 minutes by default
): Promise<string> => {
  try {
    const downloadUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    });

    return downloadUrl;
  } catch (error) {
    console.error('Error generating pre-signed download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Validate uploaded file server-side
 */
export const validateUploadedFile = async (
  key: string
): Promise<FileValidation> => {
  try {
    // Get file metadata
    const headResult = await s3.headObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();

    const fileSize = headResult.ContentLength || 0;
    const contentType = headResult.ContentType || '';

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only images and PDFs are allowed.',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating uploaded file:', error);
    return {
      isValid: false,
      error: 'Failed to validate uploaded file',
    };
  }
};

/**
 * Calculate file checksum for integrity verification
 */
export const getFileChecksum = async (key: string): Promise<string> => {
  try {
    const data = await s3.getObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();

    const hash = crypto.createHash('sha256');
    hash.update(data.Body as Buffer);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculating file checksum:', error);
    throw new Error('Failed to calculate file checksum');
  }
};

/**
 * Delete file from storage
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    await s3.headObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  validateUploadedFile,
  getFileChecksum,
  deleteFile,
  fileExists,
};
