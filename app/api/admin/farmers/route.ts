import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get all farmers (with optional status filter)
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    // Build query
    const query: any = {
      sellerStatus: { $in: ['pending', 'verified', 'rejected'] }
    };
    
    if (status && status !== 'all') {
      query.sellerStatus = status;
    }

    const farmers = await User.find(query)
      .select('name email sellerStatus farmerVerification createdAt')
      .populate('farmerVerification.reviewedBy', 'name email')
      .sort({ 'farmerVerification.submittedAt': -1, createdAt: -1 });

    return NextResponse.json({
      farmers,
      total: farmers.length
    });

  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}