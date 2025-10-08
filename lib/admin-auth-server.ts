import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyAdminAuth(req: NextRequest) {
  // Try to get token from cookie first, then from Authorization header as fallback
  let token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Using token from Authorization header for admin API');
    }
  }
  
  if (!token) {
    console.log('No auth token provided in cookies or headers for admin API');
    throw new Error('No token provided');
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log('Token verification failed for admin API:', error);
    throw new Error('Invalid token');
  }

  await dbConnect();
  
  const user = await User.findById(decoded.userId);
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    console.log('Insufficient permissions for admin API. User role:', user?.role || 'none');
    throw new Error('Insufficient permissions');
  }
  
  return user;
}