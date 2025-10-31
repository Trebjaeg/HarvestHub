import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog from '../../../../models/AuditLog';
import { verifyAdminAccess } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAccess(req);
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';
    const severity = searchParams.get('severity') || '';
    const dateFilter = searchParams.get('dateFilter') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (action && action !== 'all') {
      query.action = action;
    }
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: filterDate };
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          query.createdAt = { $gte: filterDate };
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          query.createdAt = { $gte: filterDate };
          break;
      }
    }

    // Get total count first
    const total = await AuditLog.countDocuments(query);

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // If search filter is requested, filter after population
    let filteredLogs = logs;
    if (search) {
      filteredLogs = logs.filter((log: any) => {
        const searchLower = search.toLowerCase();
        return (
          log.performedBy?.email?.toLowerCase().includes(searchLower) ||
          log.performedBy?.name?.toLowerCase().includes(searchLower) ||
          log.targetUser?.email?.toLowerCase().includes(searchLower) ||
          log.targetUser?.name?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.reason?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      logs: filteredLogs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}