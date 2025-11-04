import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ChatMessage, { generateConversationId } from '@/models/ChatMessage';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth-middleware';
import { createNotification } from '@/lib/notification-utils';
import { updateSellerResponseMetrics, incrementSellerMessagesReceived } from '@/lib/seller-metrics';

// GET - Fetch all conversations for a user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';

    // Find all unique conversations (group by conversationId)
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          senderId: { $first: '$senderId' },
          senderName: { $first: '$senderName' },
          receiverId: { $first: '$receiverId' },
          receiverName: { $first: '$receiverName' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', userId] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Get the other person's details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.senderId === userId ? conv.receiverId : conv.senderId;
        const otherUserName = conv.senderId === userId ? conv.receiverName : conv.senderName;
        
        // Try to get user profile picture
        const userProfile = await User.findById(otherUserId).select('profileImage').lean();
        
        return {
          conversationId: conv._id,
          userId: otherUserId,
          userName: otherUserName,
          userImage: userProfile?.profileImage || null,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount
        };
      })
    );

    // Filter by search query if provided
    let filteredConversations = conversationsWithUsers;
    if (searchQuery) {
      filteredConversations = conversationsWithUsers.filter(conv =>
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      conversations: filteredConversations
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { receiverId, message, attachments } = await request.json();

    if (!receiverId || (!message?.trim() && (!attachments || attachments.length === 0))) {
      return NextResponse.json(
        { error: 'Receiver ID and either message or attachments are required' },
        { status: 400 }
      );
    }

    // Get sender and receiver details
    const [sender, receiver] = await Promise.all([
      User.findById(userId).select('name firstName lastName role').lean(),
      User.findById(receiverId).select('name firstName lastName role').lean()
    ]);

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const conversationId = generateConversationId(userId, receiverId);

    // Get full names (use name if available, otherwise firstName + lastName)
    const senderName = (sender as any).name || `${(sender as any).firstName || ''} ${(sender as any).lastName || ''}`.trim() || 'User';
    const receiverName = (receiver as any).name || `${(receiver as any).firstName || ''} ${(receiver as any).lastName || ''}`.trim() || 'User';

    const chatMessage = new ChatMessage({
      conversationId,
      senderId: userId,
      senderName,
      senderRole: (sender as any).role,
      receiverId,
      receiverName,
      receiverRole: (receiver as any).role,
      message: message?.trim() || '',
      attachments: attachments || [],
      isRead: false
    });

    await chatMessage.save();

    // Update seller response metrics
    try {
      const senderRole = (sender as any).role;
      const receiverRole = (receiver as any).role;

      // If buyer is sending to seller, increment seller's received messages
      if (senderRole === 'buyer' && receiverRole === 'seller') {
        await incrementSellerMessagesReceived(receiverId);
        console.log('📊 Incremented messages received for seller:', receiverId);
      }
      
      // If seller is responding to buyer, update response metrics
      if (senderRole === 'seller' && receiverRole === 'buyer') {
        // Find the last message from the buyer (the one being responded to)
        const lastBuyerMessage = await ChatMessage.findOne({
          conversationId,
          senderId: receiverId, // The buyer
          createdAt: { $lt: chatMessage.createdAt }
        }).sort({ createdAt: -1 }).lean();

        if (lastBuyerMessage && !Array.isArray(lastBuyerMessage) && lastBuyerMessage.createdAt) {
          await updateSellerResponseMetrics(
            userId, // seller ID
            lastBuyerMessage.createdAt, // when buyer sent message
            chatMessage.createdAt // when seller responded
          );
          console.log('📊 Updated response metrics for seller:', userId);
        }
      }
    } catch (metricsError) {
      console.error('❌ Failed to update seller metrics:', metricsError);
      // Don't fail the message send if metrics update fails
    }

    // Create notification for the receiver
    try {
      console.log('📨 Creating message notification:', {
        receiverId,
        receiverRole: (receiver as any).role,
        senderName,
        actionUrl: `/inbox?userId=${userId}`
      });
      
      let notificationMessage = message?.trim() || '';
      
      // If no text message, describe attachments
      if (!notificationMessage && attachments && attachments.length > 0) {
        const imageCount = attachments.filter((att: any) => att.category === 'image').length;
        const docCount = attachments.filter((att: any) => att.category === 'document').length;
        
        const parts = [];
        if (imageCount > 0) parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);
        if (docCount > 0) parts.push(`${docCount} document${docCount > 1 ? 's' : ''}`);
        notificationMessage = `Sent ${parts.join(' and ')}`;
      }
      
      const notification = await createNotification({
        userId: receiverId,
        userRole: (receiver as any).role,
        type: 'message',
        title: `New message from ${senderName}`,
        message: notificationMessage.substring(0, 100) + (notificationMessage.length > 100 ? '...' : ''),
        relatedUserId: userId,
        relatedUserName: senderName,
        metadata: {
          conversationId,
          senderId: userId,
          actionUrl: `/inbox?userId=${userId}`
        }
      });
      
      console.log('✅ Message notification created:', notification?._id);
    } catch (notifError) {
      console.error('❌ Failed to create notification for message:', notifError);
      // Don't fail the message send if notification fails
    }

    // Emit to Socket.IO for real-time delivery to BOTH sender and receiver
    try {
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:4000';
      const messageData = {
        _id: chatMessage._id.toString(),
        conversationId: chatMessage.conversationId,
        senderId: chatMessage.senderId,
        senderName: chatMessage.senderName,
        receiverId: chatMessage.receiverId,
        receiverName: chatMessage.receiverName,
        message: chatMessage.message,
        attachments: chatMessage.attachments || [],
        createdAt: chatMessage.createdAt,
        isRead: chatMessage.isRead
      };

      // Emit to conversation room (both users will receive if they're connected)
      fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: `conversation:${conversationId}`,
          event: 'new_message',
          data: messageData
        })
      }).catch(() => {});

      // Also emit to individual user rooms for backward compatibility and offline users
      fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: `user:${receiverId}`,
          event: 'new_message',
          data: messageData
        })
      }).catch(() => {});

      fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: `user:${userId}`,
          event: 'new_message',
          data: messageData
        })
      }).catch(() => {});
    } catch (socketErr) {
      // Silent fail - message still saved to DB
    }

    return NextResponse.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
