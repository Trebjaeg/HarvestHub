import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import Appeal from '../../../../models/Appeal';
import AuditLog from '../../../../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded: any = jwt.verify(token, JWT_SECRET);
  await dbConnect();
  
  const user = await User.findById(decoded.userId);
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const appeals = await Appeal.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appeal.countDocuments(query);

    return NextResponse.json({
      appeals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Appeals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json();
    const { action, appealId, decision, adminNotes } = body;

    const appeal = await Appeal.findById(appealId)
      .populate('userId', 'name email');
    
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
            adminId: admin._id,
            adminDecision: decision,
            adminNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('userId', 'name email');
        
        // If appeal is approved, reactivate the user
        if (appeal.userId) {
          await User.findByIdAndUpdate(appeal.userId._id, { status: 'active' });
        }
        
        auditAction = 'APPEAL_APPROVED';
        break;

      case 'reject':
        updatedAppeal = await Appeal.findByIdAndUpdate(
          appealId,
          {
            status: 'rejected',
            adminId: admin._id,
            adminDecision: decision,
            adminNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('userId', 'name email');
        
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
        userEmail: appeal.userId?.email,
        decision: decision,
        adminNotes: adminNotes
      }
    });

    return NextResponse.json(updatedAppeal);

  } catch (error) {
    console.error('Appeal action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}