import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Report from '@/models/Report';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await dbConnect();
    
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // If reportId is provided, fetch single report
    if (reportId) {
      const report = await Report.findById(reportId).lean();
      if (!report) {
        return NextResponse.json({ 
          success: false, 
          message: 'Report not found' 
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        reports: [report]
      });
    }

    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { reporterName: { $regex: search, $options: 'i' } },
        { sellerName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch reports with pagination
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ priority: -1, createdAt: -1 }) // Urgent first, then newest
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Report.countDocuments(query)
    ]);

    // Get statistics
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0
    };

    stats.forEach((stat: any) => {
      statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
    });

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: reports.length,
        totalItems: total
      },
      stats: statusCounts
    });

  } catch (error) {
    console.error('Error fetching product reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    const body = await req.json();
    const { reportId, status, priority, adminNotes } = body;

    if (!reportId) {
      return NextResponse.json(
        { message: 'Report ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolvedBy = adminUser._id;
        updateData.resolvedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      return NextResponse.json(
        { message: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
      report
    });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { message: 'Failed to update report' },
      { status: 500 }
    );
  }
}
