import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      console.log('Voucher validation failed: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { code, subtotal } = await request.json();

    console.log('Validating voucher:', { code, subtotal, userId });

    if (!code) {
      console.log('Voucher validation failed: No code provided');
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    // Find voucher by code
    const voucher = await Voucher.findOne({ 
      code: code.toUpperCase().trim() 
    });

    console.log('Voucher found:', voucher ? voucher.code : 'NOT FOUND');

    if (!voucher) {
      console.log('Voucher validation failed: Invalid code');
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });
    }

    // Check if voucher is active
    if (!voucher.isActive) {
      console.log('Voucher validation failed: Not active');
      return NextResponse.json({ error: 'This voucher is no longer active' }, { status: 400 });
    }

    // Check validity dates
    const now = new Date();
    console.log('Date check:', { now, validFrom: voucher.validFrom, validUntil: voucher.validUntil });
    
    if (now < new Date(voucher.validFrom)) {
      console.log('Voucher validation failed: Not yet valid');
      return NextResponse.json({ error: 'This voucher is not yet valid' }, { status: 400 });
    }
    if (now > new Date(voucher.validUntil)) {
      console.log('Voucher validation failed: Expired');
      return NextResponse.json({ error: 'This voucher has expired' }, { status: 400 });
    }

    // Check minimum purchase
    if (subtotal < voucher.minimumPurchase) {
      return NextResponse.json({ 
        error: `Minimum purchase of ₱${voucher.minimumPurchase.toLocaleString()} required` 
      }, { status: 400 });
    }

    // Check max usage
    if (voucher.maxUsage > 0 && voucher.currentUsage >= voucher.maxUsage) {
      return NextResponse.json({ error: 'This voucher has reached its usage limit' }, { status: 400 });
    }

    // Check if user has already used this voucher (convert both to string for comparison)
    const userUsageCount = voucher.usedBy.filter(u => String(u.userId) === String(userId)).length;
    console.log('User usage check:', { userId, userUsageCount, maxUsagePerUser: voucher.maxUsagePerUser });
    
    if (voucher.maxUsagePerUser > 0 && userUsageCount >= voucher.maxUsagePerUser) {
      console.log('Voucher validation failed: User has already used this voucher');
      return NextResponse.json({ error: 'You have already used this voucher' }, { status: 400 });
    }

    // Check if for new users only
    if (voucher.forNewUsersOnly) {
      console.log('Checking if user is new user...', { userId, voucherCode: voucher.code });
      
      // Check for ANY completed or delivered orders
      const userOrderCount = await Order.countDocuments({ 
        buyerId: String(userId),
        status: { $in: ['completed', 'delivered'] }
      });
      
      console.log('User completed/delivered order count:', userOrderCount);
      
      // A new user should have 0 completed/delivered orders
      // If they have pending orders, that's fine - they're still "new" until they complete their first order
      if (userOrderCount > 0) {
        console.log('Voucher validation failed: User has completed orders, not a new user');
        return NextResponse.json({ 
          error: 'This voucher is for new users only. You have already completed an order.' 
        }, { status: 400 });
      }
      
      console.log('User is eligible: New user with no completed orders');
    }

    // Calculate discount
    let discount = 0;
    if (voucher.type === 'free_delivery') {
      discount = 0; // Will be applied to shipping in checkout
    } else if (voucher.type === 'percentage') {
      discount = (subtotal * voucher.value) / 100;
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else if (voucher.type === 'fixed_amount') {
      discount = voucher.value;
    }

    console.log('Voucher validation successful!', { code: voucher.code, type: voucher.type, discount });

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        discount: Math.round(discount * 100) / 100,
        freeDelivery: voucher.type === 'free_delivery'
      }
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to validate voucher' },
      { status: 500 }
    );
  }
}
