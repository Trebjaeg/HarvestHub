import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import UserReport from '../../../../models/UserReport';
import Appeal from '../../../../models/Appeal';
import AuditLog from '../../../../models/AuditLog';
import { verifyAdminAuth } from '../../../../lib/admin-auth-server';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(req);
    await dbConnect();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const deletedUsers = await User.countDocuments({ status: 'deleted' });

    // Get report statistics
    const pendingReports = await UserReport.countDocuments({ status: 'pending' });

    // Get appeal statistics
    const pendingAppeals = await Appeal.countDocuments({ status: 'pending' });

    // Get recent actions count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActions = await AuditLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get farmer verification statistics
    const pendingFarmers = await User.countDocuments({ sellerStatus: 'pending' });
    const verifiedFarmers = await User.countDocuments({ sellerStatus: 'verified' });
    const rejectedFarmers = await User.countDocuments({ sellerStatus: 'rejected' });

    const stats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      pendingReports,
      pendingAppeals,
      recentActions,
      pendingFarmers,
      verifiedFarmers,
      rejectedFarmers
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}