import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ vouchers: [] });
    }

    const userId = authResult.user.id;
    const now = new Date();

    // Find all active vouchers that are currently valid
    const allVouchers = await Voucher.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).select('code description type forNewUsersOnly maxUsagePerUser usedBy');

    // Filter vouchers based on user eligibility
    const eligibleVouchers = [];

    for (const voucher of allVouchers) {
      // Check if user has already used this voucher (convert both to string for comparison)
      const userUsageCount = voucher.usedBy.filter(u => String(u.userId) === String(userId)).length;
      if (voucher.maxUsagePerUser > 0 && userUsageCount >= voucher.maxUsagePerUser) {
        continue; // Skip if user has reached usage limit
      }

      // Check if for new users only
      if (voucher.forNewUsersOnly) {
        const userOrderCount = await Order.countDocuments({
          buyerId: String(userId),
          status: { $in: ['completed', 'delivered'] }
        });
        // New users should have 0 completed/delivered orders
        if (userOrderCount > 0) {
          continue; // Skip if not a new user (has completed orders)
        }
      }

      eligibleVouchers.push({
        code: voucher.code,
        description: voucher.description,
        type: voucher.type
      });
    }

    return NextResponse.json({
      success: true,
      vouchers: eligibleVouchers
    });

  } catch (error) {
    console.error('Error fetching available vouchers:', error);
    return NextResponse.json(
      { success: false, vouchers: [] },
      { status: 500 }
    );
  }
}
