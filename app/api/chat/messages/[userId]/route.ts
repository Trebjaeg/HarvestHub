import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ChatMessage, { generateConversationId } from '@/models/ChatMessage';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = authResult.user.id;
    const { userId: otherUserId } = await params;

    const conversationId = generateConversationId(currentUserId, otherUserId);

    // Fetch messages for this conversation
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read if they were sent to current user
    await ChatMessage.updateMany(
      {
        conversationId,
        receiverId: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      messages,
      conversationId
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
