import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import SellerApplication from '../../../../models/SellerApplication';
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

    // Get all farmers (users with role 'farmer' or 'seller')
    const farmers = await User.find({
      role: { $in: ['farmer', 'seller'] }
    })
      .select('firstName lastName name email role status isActive createdAt sellerStatus')
      .sort({ createdAt: -1 })
      .lean();

    // Get all seller applications to merge verification status
    const farmerIds = farmers.map(f => f._id);
    const applications = await SellerApplication.find({
      userId: { $in: farmerIds }
    })
      .select('userId status submittedAt reviewedAt')
      .lean();

    // Create a map of userId to application
    const applicationMap = new Map();
    applications.forEach(app => {
      applicationMap.set(app.userId.toString(), app);
    });

    // Merge application data with farmer data
    const farmersWithVerification = farmers.map(farmer => {
      const application = applicationMap.get(farmer._id.toString());
      return {
        ...farmer,
        farmerVerification: application ? {
          status: application.status,
          appliedAt: application.submittedAt,
          reviewedAt: application.reviewedAt
        } : undefined
      };
    });

    return NextResponse.json({
      farmers: farmersWithVerification,
      total: farmersWithVerification.length
    });

  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}