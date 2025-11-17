import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      description,
      type,
      value,
      minimumPurchase = 0,
      maxDiscount,
      maxUsage = 0,
      maxUsagePerUser = 1,
      validFrom,
      validUntil,
      forNewUsersOnly = false
    } = body;

    // Validate required fields
    if (!code || !description || !type || value === undefined || !validFrom || !validUntil) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase().trim() });
    if (existingVoucher) {
      return NextResponse.json({ 
        error: 'Voucher code already exists' 
      }, { status: 400 });
    }

    // Create voucher
    const voucher = new Voucher({
      code: code.toUpperCase().trim(),
      description,
      type,
      value,
      minimumPurchase,
      maxDiscount,
      maxUsage,
      maxUsagePerUser,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      forNewUsersOnly,
      isActive: true,
      currentUsage: 0,
      usedBy: []
    });

    await voucher.save();

    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher._id,
        code: voucher.code,
        description: voucher.description,
        type: voucher.type
      }
    });

  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}

// GET - List all vouchers (admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const vouchers = await Voucher.find()
      .select('-usedBy')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      vouchers
    });

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}
