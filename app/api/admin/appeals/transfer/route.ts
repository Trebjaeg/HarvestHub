import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import Report from '@/models/Report';
import AuditLog from '@/models/AuditLog';
import { verifyAdminAccess } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  console.log('=== Appeal Transfer API Called ===');
  
  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect();
    console.log('Step 2: Database connected successfully');

    console.log('Step 3: Verifying admin authentication...');
    let admin;
    try {
      admin = await verifyAdminAccess(req);
      console.log('Step 4: Admin authenticated:', admin.email, 'Role:', admin.role);
    } catch (authError: any) {
      console.error('Step 4: Authentication failed:', authError.message);
      return NextResponse.json({ 
        success: false,
        error: authError.message || 'Authentication failed'
      }, { status: 401 });
    }

    const body = await req.json();
    const { appealId, transferReason, newCategory = 'misleading_info' } = body;

    if (!appealId) {
      return NextResponse.json({ 
        success: false,
        error: 'Appeal ID is required'
      }, { status: 400 });
    }

    if (!transferReason || !transferReason.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Transfer reason is required'
      }, { status: 400 });
    }

    console.log('Step 5: Finding appeal to transfer...');
    const appeal = await Appeal.findById(appealId)
      .populate('user', 'name email')
      .populate('originalActionBy', 'name email');

    if (!appeal) {
      return NextResponse.json({ 
        success: false,
        error: 'Appeal not found'
      }, { status: 404 });
    }

    console.log('Step 6: Appeal found:', appeal.type, 'Status:', appeal.status);

    // Create a new report based on the appeal data
    const reportData = {
      productId: appeal.productId,
      productName: appeal.productName || 'Product from transferred appeal',
      reportedBy: appeal.user._id,
      reporterName: appeal.user.name || `${appeal.user.firstName || ''} ${appeal.user.lastName || ''}`.trim() || 'Unknown',
      reporterEmail: appeal.user.email,
      sellerId: appeal.originalActionBy?._id || appeal.user._id, // Fallback to appeal user if no original action by
      sellerName: appeal.originalActionBy?.name || 'System Action',
      reason: newCategory,
      description: `TRANSFERRED FROM APPEAL: ${appeal.reason}\n\nOriginal Appeal Details:\n- Type: ${appeal.type}\n- Original Action: ${appeal.originalAction}\n- Original Reason: ${appeal.originalReason}\n- Transfer Reason: ${transferReason}`,
      status: 'pending',
      priority: appeal.priority || 'medium',
      adminNotes: `Transferred from Appeals section by ${admin.email}. Reason: ${transferReason}`
    };

    console.log('Step 7: Creating new complaint report...');
    const newReport = await Report.create(reportData);
    console.log('Step 8: New complaint created with ID:', newReport._id);

    // Update the original appeal to mark it as transferred
    console.log('Step 9: Updating original appeal...');
    appeal.status = 'transferred';
    appeal.reviewedBy = admin._id;
    appeal.reviewedAt = new Date();
    appeal.reviewNotes = `Transferred to Complaints section. Reason: ${transferReason}`;
    appeal.decisionReason = `This case was transferred to the Complaints section as it constitutes a complaint rather than an appeal. New complaint ID: ${newReport._id}`;
    
    // Add to timeline
    appeal.timeline.push({
      action: 'Transferred to Complaints',
      performedBy: admin._id,
      date: new Date(),
      notes: `Transferred by ${admin.email}. Reason: ${transferReason}. New complaint ID: ${newReport._id}`
    });

    await appeal.save();
    console.log('Step 10: Appeal updated successfully');

    // Create audit logs for both actions
    console.log('Step 11: Creating audit logs...');
    await AuditLog.create([
      {
        performedBy: admin._id,
        action: 'appeal_transferred',
        targetUser: appeal.user._id,
        reason: transferReason,
        metadata: {
          originalAppealId: appeal._id,
          newComplaintId: newReport._id,
          appealType: appeal.type,
          transferCategory: newCategory
        },
        severity: 'medium',
        previousState: {
          type: 'appeal',
          status: appeal.status,
          id: appeal._id
        },
        newState: {
          type: 'complaint',
          status: 'pending',
          id: newReport._id
        }
      },
      {
        performedBy: admin._id,
        action: 'complaint_created_from_transfer',
        targetUser: appeal.user._id,
        reason: `Created from transferred appeal: ${transferReason}`,
        metadata: {
          originalAppealId: appeal._id,
          complaintId: newReport._id,
          category: newCategory
        },
        severity: 'low'
      }
    ]);

    console.log('Step 12: Transfer completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Appeal transferred to Complaints section successfully',
      data: {
        originalAppeal: {
          id: appeal._id,
          status: appeal.status
        },
        newComplaint: {
          id: newReport._id,
          status: newReport.status,
          reason: newReport.reason
        }
      }
    });

  } catch (error: any) {
    console.error('=== Appeal Transfer API CATCH Block ===');
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