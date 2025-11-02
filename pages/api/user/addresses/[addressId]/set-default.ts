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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    if (!user.addresses) {
      clearTimeout(timeoutId);
      return res.status(404).json({ message: 'Address not found' });
    }

    const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      clearTimeout(timeoutId);
      return res.status(404).json({ message: 'Address not found' });
    }

    // Unset all defaults
    user.addresses.forEach((addr: any) => {
      addr.isDefault = false;
    });

    // Set this address as default
    user.addresses[addressIndex].isDefault = true;
    user.addresses[addressIndex].updatedAt = new Date();

    await user.save();

    clearTimeout(timeoutId);
    return res.status(200).json({
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error setting default address:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
