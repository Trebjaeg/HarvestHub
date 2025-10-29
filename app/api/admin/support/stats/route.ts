import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import SupportTicket from '../../../../../models/SupportTicket';

// Enhanced token verification for admin routes
async function verifyAdminAuth(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value || 
                request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      return { success: false, error: 'Server configuration error' };
    }

    const decoded = jwt.verify(token, secret) as any;
    
    if (!['admin', 'superadmin'].includes(decoded.role)) {
      return { success: false, error: 'Admin access required' };
    }
    
    return { 
      success: true, 
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}

// GET /api/admin/support/stats - Get support ticket statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get status counts
    const statusCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get priority distribution
    const priorityCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category distribution
    const categoryCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average satisfaction rating
    const satisfactionStats = await SupportTicket.aggregate([
      {
        $match: {
          'satisfaction.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$satisfaction.rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Calculate response and resolution times
    const timeStats = await SupportTicket.aggregate([
      {
        $match: {
          status: { $in: ['resolved', 'closed'] }
        }
      },
      {
        $addFields: {
          firstResponseTime: {
            $cond: {
              if: { $gt: [{ $size: '$messages' }, 1] },
              then: {
                $subtract: [
                  { $arrayElemAt: ['$messages.createdAt', 1] },
                  { $arrayElemAt: ['$messages.createdAt', 0] }
                ]
              },
              else: null
            }
          },
          resolutionTime: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$firstResponseTime' },
          avgResolutionTime: { $avg: '$resolutionTime' },
          totalResolved: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await SupportTicket.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Format the data
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const priorityMap = priorityCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const categoryMap = categoryCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const totalTickets = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    const satisfactionAvg = satisfactionStats[0]?.avgRating || 0;
    const avgResponseTime = timeStats[0]?.avgResponseTime || 0;
    const avgResolutionTime = timeStats[0]?.avgResolutionTime || 0;

    // Convert milliseconds to hours for display
    const avgResponseHours = avgResponseTime / (1000 * 60 * 60);
    const avgResolutionHours = avgResolutionTime / (1000 * 60 * 60);

    const stats = {
      total: totalTickets,
      pending: statusMap.pending || 0,
      inProgress: statusMap.in_progress || 0,
      resolved: statusMap.resolved || 0,
      closed: statusMap.closed || 0,
      reopened: statusMap.reopened || 0,
      avgResponseTime: Math.round(avgResponseHours * 100) / 100,
      avgResolutionTime: Math.round(avgResolutionHours * 100) / 100,
      satisfactionAvg: Math.round(satisfactionAvg * 100) / 100,
      priorityDistribution: {
        low: priorityMap.low || 0,
        medium: priorityMap.medium || 0,
        high: priorityMap.high || 0,
        urgent: priorityMap.urgent || 0
      },
      categoryDistribution: categoryMap,
      recentActivity: recentActivity.map(item => ({
        date: item._id.date,
        count: item.count
      }))
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching support stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support statistics' },
      { status: 500 }
    );
  }
}