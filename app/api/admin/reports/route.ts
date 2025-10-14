import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import UserReport from '@/models/UserReport';
import AuditLog from '@/models/AuditLog';

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

    const reports = await UserReport.find(query)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserReport.countDocuments(query);

    return NextResponse.json({
      reports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json();
    const { action, reportId, decision, adminNotes } = body;

    const report = await UserReport.findById(reportId)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email');
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let updatedReport;
    let auditAction;

    switch (action) {
      case 'resolve':
        updatedReport = await UserReport.findByIdAndUpdate(
          reportId,
          {
            status: 'resolved',
            adminId: admin._id,
            adminDecision: decision,
            adminNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('reporterId', 'name email')
         .populate('reportedUserId', 'name email');
        
        auditAction = 'REPORT_RESOLVED';
        break;

      case 'dismiss':
        updatedReport = await UserReport.findByIdAndUpdate(
          reportId,
          {
            status: 'dismissed',
            adminId: admin._id,
            adminDecision: decision,
            adminNotes: adminNotes,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('reporterId', 'name email')
         .populate('reportedUserId', 'name email');
        
        auditAction = 'REPORT_DISMISSED';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the action
    await AuditLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      action: auditAction,
      targetType: 'UserReport',
      targetId: reportId,
      details: {
        reportType: report.type,
        reportedUserEmail: report.reportedUserId?.email,
        decision: decision,
        adminNotes: adminNotes
      }
    });

    return NextResponse.json(updatedReport);

  } catch (error) {
    console.error('Report action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}