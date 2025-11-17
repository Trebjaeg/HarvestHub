import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export const config = {
  api: {
    responseLimit: '10mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timeout' });
    }
  }, 8000);

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

    const { addressId } = req.query;

    if (!addressId || typeof addressId !== 'string') {
      clearTimeout(timeoutId);
      return res.status(400).json({ message: 'Address ID is required' });
    }

    const user = await User.findById(userId).select('addresses');
    
    if (!user) {
      clearTimeout(timeoutId);
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.method === 'PUT') {
      // Update address
      const { label, fullName, phone, street, barangay, city, province, zipCode, isDefault, type } = req.body;
      const { label, fullName, phone, street, barangay, city, province, zipCode, isDefault, type } = req.body;

      if (!user.addresses) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'Address not found' });
      }

      const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === addressId);
      
      if (addressIndex === -1) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'Address not found' });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        user.addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
      }

      // Update the address
      user.addresses[addressIndex] = {
        ...user.addresses[addressIndex],
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
        updatedAt: new Date()
      };

      await user.save();

      clearTimeout(timeoutId);
      return res.status(200).json({
        message: 'Address updated successfully',
        addresses: user.addresses
      });
    } 
    
    else if (req.method === 'DELETE') {
      // Delete address
      if (!user.addresses) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'Address not found' });
      }

      const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === addressId);
      
      if (addressIndex === -1) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: 'Address not found' });
      }

      user.addresses.splice(addressIndex, 1);
      await user.save();

      clearTimeout(timeoutId);
      return res.status(200).json({
        message: 'Address deleted successfully',
        addresses: user.addresses
      });
    }
    
    else {
      clearTimeout(timeoutId);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in address API:', error);
    console.error('Request body:', req.body);
    console.error('Address ID:', req.query.addressId);
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
