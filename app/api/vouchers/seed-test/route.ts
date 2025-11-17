import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';

export async function GET(request: NextRequest) {
  return seedTestVoucher();
}

export async function POST(request: NextRequest) {
  return seedTestVoucher();
}

async function seedTestVoucher() {
  try {
    await dbConnect();

    // Check if voucher already exists
    const existing = await Voucher.findOne({ code: 'TESTFREE' });
    if (existing) {
      return NextResponse.json({ 
        message: 'Voucher TESTFREE already exists',
        voucher: existing
      });
    }

    // Create a test voucher that works for ALL users (not just new users)
    const voucher = new Voucher({
      code: 'TESTFREE',
      description: 'Free delivery for testing (works for all users)',
      type: 'free_delivery',
      value: 0,
      minimumPurchase: 0,
      maxUsage: 0, // Unlimited
      maxUsagePerUser: 10, // Can use 10 times per user
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      forNewUsersOnly: false, // Works for ALL users
      isActive: true,
      currentUsage: 0,
      usedBy: []
    });

    await voucher.save();

    return NextResponse.json({
      success: true,
      message: 'Test voucher TESTFREE created successfully!',
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
    console.error('Error seeding test voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create test voucher' },
      { status: 500 }
    );
  }
}
