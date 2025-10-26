import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth-middleware';

// GET /api/appeals - Get user's appeals
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;

    console.log('Fetching appeals for user:', userId);

    // Get all appeals for this user
    const appeals = await Appeal.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email')
      .populate('originalActionBy', 'name email')
      .lean();

    console.log('Found appeals:', appeals.length);

    return NextResponse.json({
      success: true,
      appeals
    });

  } catch (error: any) {
    console.error('Error fetching appeals:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/appeals - Submit new appeal
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    
    const { subject, explanation, evidence } = body;

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

    // Get user details for appeal context
    const user = await User.findById(userId).select('status suspendReason suspendedAt suspendedBy role email name');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine appeal type
    let appealType = 'suspension';
    if (user.status === 'deleted') {
      appealType = 'deletion';
    }

    // Create appeal
    const appeal = await Appeal.create({
      user: userId,
      type: appealType,
      reason: explanation,
      originalAction: `Account ${user.status}`,
      originalReason: user.suspendReason || 'No reason provided',
      originalDate: user.suspendedAt || new Date(),
      originalActionBy: user.suspendedBy || userId,
      evidence: evidence || [],
      status: 'pending',
      priority: 'medium',
      timeline: [{
        action: 'Appeal submitted',
        performedBy: userId,
        date: new Date(),
        notes: subject || 'User submitted suspension appeal'
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

  } catch (error: any) {
    console.error('Error creating appeal:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
