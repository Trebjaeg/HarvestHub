import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set timeout for API route
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timeout' });
    }
  }, 15000); // Increase to 15 seconds

  try {
    // Get user from auth token
    const token = req.cookies['auth-token'];
    if (!token) {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    if (req.method === 'GET') {
      // Get all addresses for the user - optimized query
      const user = await User.findById(userId)
        .select('addresses')
        .maxTimeMS(5000) // Add 5 second timeout
        .lean()
        .exec();
      
      if (!user) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'User not found' });
      }

      clearTimeout(timeoutId);
      return res.status(200).json({
        addresses: user.addresses || []
      });
    } 
    
    else if (req.method === 'POST') {
      // Add new address
      const { label, fullName, phone, street, barangay, city, province, zipCode, isDefault, type } = req.body;

      // Validate required fields
      if (!label || !fullName || !phone || !street || !city || !province) {
        clearTimeout(timeoutId);
        return res.status(400).json({ message: 'All required fields must be filled' });
      }

      const user = await User.findById(userId).select('addresses');
      
      if (!user) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'User not found' });
      }

      // Check address limit
      if (user.addresses && user.addresses.length >= 3) {
        clearTimeout(timeoutId);
        return res.status(400).json({ message: 'Maximum 3 addresses allowed' });
      }

      // If setting as default, unset other defaults
      if (isDefault && user.addresses) {
        user.addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
      }

      const newAddress = {
        label,
        fullName,
        phone,
        street,
        barangay: barangay || '',
        city,
        province,
        zipCode: zipCode || '',
        isDefault: isDefault || false,
        type: type || 'delivery',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!user.addresses) {
        user.addresses = [] as any;
      }
      
      user.addresses.push(newAddress);
      await user.save();

      clearTimeout(timeoutId);
      return res.status(201).json({
        message: 'Address added successfully',
        addresses: user.addresses
      });
    }
    
    else {
      clearTimeout(timeoutId);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in addresses API:', error);
    console.error('Request body:', req.body);
    console.error('Request method:', req.method);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No additional details'
      });
    }
  } finally {
    clearTimeout(timeoutId);
  }
};
