import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';

export const config = {
  api: {
    bodyParser: true,
  },
};

interface DecodedToken {
  userId: string;
  email: string;
}

// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'harvesthub-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { fileName, fileType, folder = 'products' } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${decoded.userId}.${extension}`;
    const key = `${folder}/${uniqueFileName}`;

    // Generate presigned URL for direct upload to Spaces
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5 minutes
      ACL: 'public-read',
    });

    const CDN_URL = process.env.DO_SPACES_CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`;
    const publicUrl = `${CDN_URL}/${key}`;

    return res.status(200).json({
      success: true,
      uploadUrl: presignedUrl,
      publicUrl,
      fileName: uniqueFileName,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message
    });
  }
}

export default handler;
