import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../../../models/User';
import AuditLog from '../../../../../../models/AuditLog';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Review farmer application (approve/reject)
export async function POST(
  req: NextRequest,
  context: { params: { farmerId: string } }
) {
  try {
    const { farmerId } = context.params;
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

    const { action, rejectionReason, notes } = await req.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    if (farmer.sellerStatus !== 'pending') {
      return NextResponse.json({ error: 'Farmer application has already been reviewed' }, { status: 400 });
    }

    // Update farmer status
    const updateData: any = {
      sellerStatus: action === 'approve' ? 'verified' : 'rejected',
      'farmerVerification.reviewedAt': new Date(),
      'farmerVerification.reviewedBy': adminUser._id
    };

    if (action === 'reject') {
      updateData['farmerVerification.rejectionReason'] = rejectionReason;
    }

    if (notes?.trim()) {
      updateData['farmerVerification.notes'] = notes;
    }

    await User.findByIdAndUpdate(farmerId, updateData);

    // Create audit log
    await AuditLog.create({
      adminId: adminUser._id,
      action: action === 'approve' ? 'farmer_verified' : 'farmer_rejected',
      targetType: 'User',
      targetId: farmerId,
      details: {
        farmerName: farmer.name,
        farmerEmail: farmer.email,
        action: action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
        notes: notes || undefined
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json({
      message: `Farmer application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      status: action === 'approve' ? 'verified' : 'rejected'
    });

  } catch (error) {
    console.error('Error reviewing farmer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}