import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import UserReport from '../../../../models/UserReport';
import Report from '../../../../models/Report';
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

    // Get report statistics (both user reports and product reports)
    const pendingReports = await UserReport.countDocuments({ status: 'pending' });
    const activeProductReports = await Report.countDocuments({ 
      status: { $in: ['pending', 'investigating'] } 
    });
    const totalReports = pendingReports + activeProductReports;

    // Get appeal statistics
    const pendingAppeals = await Appeal.countDocuments({ status: 'pending' });

    // Get recent actions count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActions = await AuditLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get farmer statistics
    const totalFarmers = await User.countDocuments({ role: 'seller' });
    const pendingFarmers = await User.countDocuments({ 
      role: 'seller',
      sellerStatus: 'pending' 
    });
    const verifiedFarmers = await User.countDocuments({ 
      role: 'seller',
      sellerStatus: 'verified' 
    });
    const rejectedFarmers = await User.countDocuments({ 
      role: 'seller',
      sellerStatus: 'rejected' 
    });

    const stats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      totalReports,
      pendingReports,
      activeProductReports,
      pendingAppeals,
      recentActions,
      totalFarmers,
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