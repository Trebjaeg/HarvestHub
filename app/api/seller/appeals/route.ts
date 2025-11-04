import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth-middleware';

// GET /api/seller/appeals - Get seller's appeals
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Verify user is a seller
    const user = await User.findById(userId).select('role');
    if (!user || user.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Seller role required.' }, { status: 403 });
    }

    console.log('Fetching appeals for seller:', userId);

    // Get all appeals for this seller
    const appeals = await Appeal.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email')
      .populate('originalActionBy', 'name email')
      .lean();

    console.log('Found seller appeals:', appeals.length);

    return NextResponse.json(appeals);

  } catch (error: unknown) {
    console.error('Error fetching seller appeals:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/seller/appeals - Submit new seller appeal
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Verify user is a seller
    const user = await User.findById(userId).select('role status suspendReason suspendedAt suspendedBy');
    if (!user || user.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Seller role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, explanation, evidence, appealType, productId, productName } = body;

    // Validate required fields
    if (!explanation || explanation.trim().length < 20) {
      return NextResponse.json({
        error: 'Explanation is required and must be at least 20 characters'
      }, { status: 400 });
    }

    if (explanation.length > 2000) {
      return NextResponse.json({
        error: 'Explanation must be less than 2000 characters'
      }, { status: 400 });
    }

    // Determine appeal type
    let finalAppealType = appealType || 'suspension';
    let originalAction = `Account ${user.status}`;
    let originalReason = user.suspendReason || 'No reason provided';
    let originalDate = user.suspendedAt || new Date();
    let originalActionBy = user.suspendedBy || userId;

    // Handle product-specific appeals
    if (finalAppealType === 'listing_removal' && productId) {
      originalAction = 'Product deactivation';
      originalReason = 'Product taken down by administrator';
      originalDate = new Date(); // Could fetch from product if available
      originalActionBy = userId; // Could fetch from product takenDownBy if available
    } else if (user.status === 'deleted') {
      finalAppealType = 'deletion';
    }

    // Create appeal
    const appeal = await Appeal.create({
      user: userId,
      type: finalAppealType,
      productId: productId || null,
      productName: productName || null,
      reason: explanation,
      originalAction,
      originalReason,
      originalDate,
      originalActionBy,
      evidence: evidence || [],
      status: 'pending',
      priority: finalAppealType === 'listing_removal' ? 'low' : 'medium',
      timeline: [{
        action: `${finalAppealType === 'listing_removal' ? 'Product listing removal' : 'Account'} appeal submitted`,
        performedBy: userId,
        date: new Date(),
        notes: subject || `Seller submitted ${finalAppealType} appeal`
      }]
    });

    // Populate for response
    const populatedAppeal = await Appeal.findById(appeal._id)
      .populate('user', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully. Our team will review it within 24-48 hours.',
      appeal: populatedAppeal
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating seller appeal:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}