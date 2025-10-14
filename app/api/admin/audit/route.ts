import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog from '../../../../models/AuditLog';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const action = searchParams.get('action') || '';
    const adminEmail = searchParams.get('adminEmail') || '';

    const skip = (page - 1) * limit;

    // Build query - only filter by fields that exist in the schema
    const query: any = {};
    if (action) query.action = { $regex: action, $options: 'i' };

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'email firstName lastName')
      .populate('targetUser', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // If adminEmail filter is requested, filter after population
    let filteredLogs = logs;
    if (adminEmail) {
      filteredLogs = logs.filter((log: any) => 
        log.performedBy?.email?.toLowerCase().includes(adminEmail.toLowerCase())
      );
    }

    const total = await AuditLog.countDocuments(query);

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