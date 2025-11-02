import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// PATCH /api/admin/farmers/[farmerId]/toggle-status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ farmerId: string }> }
) {
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

    const { farmerId } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !['active', 'deleted'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "active" or "deleted"' }, { status: 400 });
    }

    // Find and update the farmer
    const farmer = await User.findById(farmerId);
    
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    if (!['farmer', 'seller'].includes(farmer.role)) {
      return NextResponse.json({ error: 'User is not a farmer or seller' }, { status: 400 });
    }

    // Update the status
    farmer.status = status;
    farmer.updatedAt = new Date();
    
    await farmer.save();

    return NextResponse.json({
      success: true,
      message: `Farmer status updated to ${status}`,
      farmer: {
        _id: farmer._id,
        name: farmer.name || `${farmer.firstName} ${farmer.lastName}`,
        email: farmer.email,
        status: farmer.status,
      }
    });

  } catch (error) {
    console.error('Error toggling farmer status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
