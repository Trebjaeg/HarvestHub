import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import Appeal from '../../../../models/Appeal';
import AuditLog from '../../../../models/AuditLog';
import { verifyAdminAccess } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  console.log('=== Admin Appeals GET API Called ===');
  
  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect();
    console.log('Step 2: Database connected successfully');

    console.log('Step 3: Verifying admin authentication...');
    let user;
    try {
      user = await verifyAdminAccess(req);
      console.log('Step 4: Admin authenticated:', user.email, 'Role:', user.role);
    } catch (authError: any) {
      console.error('Step 4: Authentication failed:', authError.message);
      return NextResponse.json({ 
        success: false,
        error: authError.message || 'Authentication failed'
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    console.log('Step 7: Query params:', { page, limit, skip, query });
    console.log('Step 8: Fetching appeals from database...');

    // Try without populate first to isolate the issue
    let appeals;
    try {
      appeals = await Appeal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      console.log('Step 9: Raw appeals found:', appeals?.length || 0);
      
      // Now try to populate
      if (appeals && appeals.length > 0) {
        console.log('Step 10: Populating user references...');
        appeals = await Appeal.find(query)
          .populate('user', 'name email role status')
          .populate('reviewedBy', 'name email')
          .populate('originalActionBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
        console.log('Step 11: Appeals populated successfully');
      }
    } catch (dbError: any) {
      console.error('Step 9-11 ERROR: Database query failed:', dbError.message);
      throw dbError;
    }

    console.log('Step 12: Counting total documents...');
    const total = await Appeal.countDocuments(query);
    console.log('Step 13: Total appeals:', total);

    const response = {
      success: true,
      appeals: appeals || [],
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };
    
    console.log('Step 14: Returning response with', appeals?.length || 0, 'appeals');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('=== Appeals API CATCH Block ===');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    const errorResponse = { 
      success: false,
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      errorType: error?.name || 'UnknownError'
    };
    
    console.error('Returning error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Verify admin authentication
    let admin;
    try {
      admin = await verifyAdminAccess(req);
    } catch (authError: any) {
      return NextResponse.json({ 
        success: false,
        error: authError.message || 'Authentication failed'
      }, { status: 401 });
    }

    const body = await req.json();
    const { action, appealId, decision, adminNotes } = body;

    const appeal = await Appeal.findById(appealId)
      .populate('user', 'name email');
    
    if (!appeal) {
      return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    let updatedAppeal;
    let auditAction;

    switch (action) {
      case 'approve':
        updatedAppeal = await Appeal.findByIdAndUpdate(
          appealId,
          {
            status: 'approved',
            reviewedBy: admin._id,
            decision: decision,
            reviewNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('user', 'name email');
        
        // If appeal is approved, reactivate the user
        if (appeal.user) {
          await User.findByIdAndUpdate(appeal.user._id, { 
            status: 'active',
            suspendReason: null,
            suspendedAt: null,
            suspendedBy: null,
            suspensionExpiresAt: null
          });
        }
        
        auditAction = 'APPEAL_APPROVED';
        break;

      case 'reject':
        updatedAppeal = await Appeal.findByIdAndUpdate(
          appealId,
          {
            status: 'rejected',
            reviewedBy: admin._id,
            decision: decision,
            reviewNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('user', 'name email');
        
        auditAction = 'APPEAL_REJECTED';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the action
    await AuditLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      action: auditAction,
      targetType: 'Appeal',
      targetId: appealId,
      details: {
        appealType: appeal.type,
        userEmail: appeal.user?.email,
        decision: decision,
        adminNotes: adminNotes
      }
    });

    return NextResponse.json(updatedAppeal);

  } catch (error: any) {
    console.error('Appeal action API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}