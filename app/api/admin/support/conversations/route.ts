import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportConversation from '@/models/SupportConversation';
import ChatMessage from '@/models/ChatMessage';
import { verifyAdminAuth } from '@/lib/admin-auth-server';

// GET /api/admin/support/conversations - Get all support conversations for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminAuth(request);
    
    console.log('✅ Admin access granted for user:', user._id, 'role:', user.role);

    await dbConnect();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch conversations with latest activity first
    const conversations = await SupportConversation.find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Get message count for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv: any) => {
        const messageCount = await ChatMessage.countDocuments({
          supportConversationId: conv._id.toString()
        });

        const unreadCount = await ChatMessage.countDocuments({
          supportConversationId: conv._id.toString(),
          senderRole: { $ne: 'admin' }, // Messages not from admin
          isRead: false
        });

        return {
          _id: conv._id.toString(),
          userId: conv.userId,
          userName: conv.userName,
          userEmail: conv.userEmail,
          userRole: conv.userRole,
          status: conv.status,
          priority: conv.priority || 'medium',
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          createdAt: conv.createdAt,
          messageCount,
          unreadCount
        };
      })
    );

    // Get stats
    const stats = {
      total: await SupportConversation.countDocuments(),
      open: await SupportConversation.countDocuments({ status: 'open' }),
      inProgress: await SupportConversation.countDocuments({ status: 'in_progress' }),
      resolved: await SupportConversation.countDocuments({ status: 'resolved' }),
      closed: await SupportConversation.countDocuments({ status: 'closed' })
    };

    return NextResponse.json({
      success: true,
      conversations: conversationsWithCounts,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching support conversations:', error);
    
    // Handle authentication errors
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support conversations' },
      { status: 500 }
    );
  }
}