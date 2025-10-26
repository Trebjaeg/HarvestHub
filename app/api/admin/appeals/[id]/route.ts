import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifyAdminAccess } from '@/lib/rbac';

// PATCH /api/admin/appeals/[id] - Review an appeal (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify admin authentication
    let admin;
    try {
      admin = await verifyAdminAccess(request);
    } catch (authError: any) {
      return NextResponse.json({ 
        success: false,
        error: authError.message || 'Authentication failed'
      }, { status: 401 });
    }

    const adminId = admin.id;
    const appealId = params.id;
    const body = await request.json();

    const { decision, reviewNotes, decisionReason } = body;

    // Validate input
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({
        error: 'Valid decision (approved/rejected) is required'
      }, { status: 400 });
    }

    if (!reviewNotes || !reviewNotes.trim()) {
      return NextResponse.json({
        error: 'Review notes are required'
      }, { status: 400 });
    }

    if (!decisionReason || !decisionReason.trim()) {
      return NextResponse.json({
        error: 'Decision reason is required'
      }, { status: 400 });
    }

    // Find the appeal
    const appeal = await Appeal.findById(appealId).populate('user');
    
    if (!appeal) {
      return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // Check if already reviewed
    if (appeal.status === 'approved' || appeal.status === 'rejected') {
      return NextResponse.json({
        error: 'This appeal has already been reviewed'
      }, { status: 400 });
    }

    // Update appeal
    appeal.status = decision === 'approved' ? 'approved' : 'rejected';
    appeal.decision = decision;
    appeal.reviewedBy = adminId;
    appeal.reviewedAt = new Date();
    appeal.reviewNotes = reviewNotes;
    appeal.decisionReason = decisionReason;

    // Add to timeline
    appeal.timeline.push({
      action: `Appeal ${decision}`,
      performedBy: adminId,
      date: new Date(),
      notes: decisionReason
    });

    // If approved, restore the user's account
    if (decision === 'approved') {
      const user = await User.findById(appeal.user._id);
      if (user && user.status === 'suspended') {
        user.status = 'active';
        user.suspendReason = null;
        user.suspendedAt = null;
        user.suspendedBy = null;
        user.suspensionExpiresAt = null;
        await user.save();

        appeal.actionTaken = 'Account restored to active status';
      }
    }

    await appeal.save();

    // Create audit log
    await AuditLog.create({
      performedBy: adminId,
      action: decision === 'approved' ? 'appeal_approved' : 'appeal_rejected',
      targetUser: appeal.user._id,
      reason: decisionReason,
      metadata: {
        appealId: appeal._id,
        appealType: appeal.type,
        reviewNotes: reviewNotes,
        actionTaken: appeal.actionTaken
      },
      severity: decision === 'approved' ? 'high' : 'medium',
      previousState: {
        status: 'pending',
        appealReason: appeal.reason
      },
      newState: {
        status: decision,
        decisionReason: decisionReason
      }
    });

    // Populate for response
    const populatedAppeal = await Appeal.findById(appeal._id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      message: `Appeal ${decision} successfully`,
      appeal: populatedAppeal
    });

  } catch (error: any) {
    console.error('Error reviewing appeal:', error);
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
