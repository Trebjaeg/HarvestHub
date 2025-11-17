import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';

export async function GET(request: NextRequest) {
  return seedVoucher();
}

export async function POST(request: NextRequest) {
  return seedVoucher();
}

async function seedVoucher() {
  try {
    await dbConnect();

    // Check if voucher already exists
    const existing = await Voucher.findOne({ code: 'HARVESTHUBDEFENDED' });
    if (existing) {
      return NextResponse.json({ 
        message: 'Voucher HARVESTHUBDEFENDED already exists',
        voucher: existing
      });
    }

    // Create the voucher
    const voucher = new Voucher({
      code: 'HARVESTHUBDEFENDED',
      description: 'Free delivery for all users',
      type: 'free_delivery',
      value: 0,
      minimumPurchase: 0,
      maxUsage: 0, // Unlimited
      maxUsagePerUser: 1, // One time per user
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2025-12-31'),
      forNewUsersOnly: false, // Changed to work for ALL users
      isActive: true,
      currentUsage: 0,
      usedBy: []
    });

    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Voucher HARVESTHUBDEFENDED created successfully!',
      voucher: {
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        forNewUsersOnly: voucher.forNewUsersOnly,
        validFrom: voucher.validFrom,
        validUntil: voucher.validUntil
      }
    });

  } catch (error) {
    console.error('Error seeding voucher:', error);
    return NextResponse.json(
      { error: 'Failed to seed voucher' },
      { status: 500 }
    );
  }
}
