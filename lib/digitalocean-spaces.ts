import AWS from 'aws-sdk';

// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  // Required for DigitalOcean Spaces
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'harvesthub-storage';
const CDN_URL = process.env.DO_SPACES_CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`;

export const uploadToSpaces = async (
  file: Buffer, 
  fileName: string, 
  contentType: string,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    const key = `${folder}/${fileName}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Makes the file publicly accessible
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    const result = await s3.upload(uploadParams).promise();
    
    // Return CDN URL for better performance
    return `${CDN_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to DigitalOcean Spaces:', error);
    throw new Error('Failed to upload file to storage');
  }
};

export const deleteFromSpaces = async (fileUrl: string): Promise<void> => {
  try {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
  } catch (error) {
    console.error('Error deleting from DigitalOcean Spaces:', error);
    throw new Error('Failed to delete file from storage');
  }
};

export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
};

export { s3, BUCKET_NAME, CDN_URL };