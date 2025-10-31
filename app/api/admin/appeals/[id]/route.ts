import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import User from '@/models/User';
import Product from '@/models/Product';
import AuditLog from '@/models/AuditLog';
import { verifyAdminAccess } from '@/lib/rbac';
import cache from '@/lib/memory-cache';

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

    // If approved, restore the user's account or reactivate the product
    if (decision === 'approved') {
      // Handle account suspension appeals
      if (appeal.type === 'suspension' || appeal.type === 'deletion' || appeal.type === 'warning') {
        const userId = typeof appeal.user === 'object' ? appeal.user._id : appeal.user;
        // @ts-ignore - MongoDB $unset operation
        await User.findByIdAndUpdate(userId, {
          $set: { status: 'active' },
          $unset: {
            suspendReason: '',
            suspendedAt: '',
            suspendedBy: '',
            suspensionExpiresAt: ''
          }
        });

        appeal.actionTaken = 'Account restored to active status';
      }
      
      // Handle product listing removal appeals
      if (appeal.type === 'listing_removal' && appeal.productId) {
        // Direct database update using updateOne for guaranteed persistence
        const updateResult = await Product.updateOne(
          { _id: appeal.productId },
          { 
            $set: { 
              isActive: true,
              status: 'Available'
            }
          }
        );

        if (updateResult.matchedCount === 0) {
          return NextResponse.json({
            error: 'Product not found'
          }, { status: 404 });
        }

        // Check if the update was actually applied
        if (updateResult.modifiedCount === 0) {
          // Try alternative update method
          const product = await Product.findById(appeal.productId);
          if (product) {
            product.isActive = true;
            product.status = 'Available';
            await product.save();
          }
        }

        // Verify the update actually worked
        const verifyProduct = await Product.findById(appeal.productId).lean();
        
        // CRITICAL: Verify the product is actually active
        if (!verifyProduct?.isActive || verifyProduct.status !== 'Available') {
          return NextResponse.json({
            error: 'Failed to reactivate product',
            details: {
              isActive: verifyProduct?.isActive,
              status: verifyProduct?.status,
              productId: appeal.productId
            }
          }, { status: 500 });
        }
        
        // Clear only product-related caches (more targeted approach)
        const productCachePatterns = [
          `products:*`,
          `product:${appeal.productId}`,
          `favorites:*`,
          `best-sellers:*`,
          `deals:*`,
          `top-farmers:*`
        ];
        
        for (const pattern of productCachePatterns) {
          try {
            cache.delPattern(pattern);
          } catch (e) {
            // Silent fail - cache clear is not critical
          }
        }

        appeal.actionTaken = `Product "${verifyProduct?.name}" reactivated successfully (isActive: ${verifyProduct?.isActive})`;
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
