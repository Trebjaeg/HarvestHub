import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Debug: Log all cookies
    const allCookies = req.cookies.getAll();
    console.log('All cookies received:', allCookies);
    
    const token = req.cookies.get('auth-token')?.value;
    console.log('Auth token found:', token ? 'Yes' : 'No');
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Try to get token from cookie first, then from Authorization header as fallback
    let authToken = token;
    if (!authToken) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
        console.log('Using token from Authorization header');
      }
    }

    if (!authToken) {
      console.log('No auth token provided in cookies or headers');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authToken, JWT_SECRET);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Skip tokenVersion check for now - can be added later for enhanced security

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}