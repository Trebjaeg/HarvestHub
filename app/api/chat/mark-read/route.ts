import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { conversationId, messageIds } = await request.json();

    if (!conversationId || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // ACL: Verify user is participant in conversation
    const [userId1, userId2] = conversationId.split('_').sort();
    if (userId !== userId1 && userId !== userId2) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update messages
    const result = await ChatMessage.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
        receiverId: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    // Get updated unread count
    const unreadCount = await ChatMessage.countDocuments({
      receiverId: userId,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      unreadCount
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
