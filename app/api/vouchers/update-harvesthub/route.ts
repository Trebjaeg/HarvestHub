import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';

export async function GET(request: NextRequest) {
  return updateVoucher();
}

export async function POST(request: NextRequest) {
  return updateVoucher();
}

async function updateVoucher() {
  try {
    await dbConnect();

    // Find and update the HARVESTHUBDEFENDED voucher
    const voucher = await Voucher.findOneAndUpdate(
      { code: 'HARVESTHUBDEFENDED' },
      { 
        forNewUsersOnly: false, // Change to work for all users
        description: 'Free delivery for all users' // Update description too
      },
      { new: true }
    );

    if (!voucher) {
      return NextResponse.json({ 
        error: 'Voucher HARVESTHUBDEFENDED not found. Please create it first.' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'HARVESTHUBDEFENDED voucher updated to work for ALL users!',
      voucher: {
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        forNewUsersOnly: voucher.forNewUsersOnly
      }
    });

  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to update voucher' },
      { status: 500 }
    );
  }
}
