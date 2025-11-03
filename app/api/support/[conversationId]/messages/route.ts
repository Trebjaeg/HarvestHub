import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportConversation from '@/models/SupportConversation';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';

async function verifyAuth(request: NextRequest) {
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
    
    // Fetch user from database to get authoritative role
    await dbConnect();
    const user = await User.findById(decoded.userId || decoded.id).select('_id email role');
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    return { 
      success: true, 
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role // Get role from database, not JWT
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Invalid or expired token' };
  }
}

// GET /api/support/[conversationId]/messages - Get all messages in a support conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Next.js 15: await params first
    const { conversationId } = await params;

    // Verify conversation exists and user has access to it
    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is the conversation owner or an admin/superadmin
    const isOwner = conversation.userId === authResult.user!.id;
    const isAdmin = authResult.user!.role === 'admin' || authResult.user!.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      console.log('❌ Access denied - User:', authResult.user!.id, 'Role:', authResult.user!.role, 'ConversationOwner:', conversation.userId);
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this conversation' },
        { status: 403 }
      );
    }

    console.log('✅ Access granted - User:', authResult.user!.id, 'Role:', authResult.user!.role, 'IsAdmin:', isAdmin, 'IsOwner:', isOwner);

    // Fetch all messages for this support conversation
    const messages = await ChatMessage.find({
      supportConversationId: conversationId
    }).sort({ createdAt: 1 }).lean();

    // Format messages for response
    const formattedMessages = messages.map((msg: any) => ({
      _id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      message: msg.message,
      createdAt: msg.createdAt,
      isRead: msg.isRead || false
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/support/[conversationId]/messages - Send a new message in support conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Next.js 15: await params first
    const { conversationId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is the conversation owner or an admin/superadmin
    const isOwner = conversation.userId === authResult.user!.id;
    const isAdmin = authResult.user!.role === 'admin' || authResult.user!.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this conversation' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await User.findById(authResult.user!.id).select('name email role');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Determine sender role
    let senderRole: 'buyer' | 'seller' | 'admin' = 'buyer';
    if (authResult.user!.role === 'admin' || authResult.user!.role === 'superadmin') {
      senderRole = 'admin';
    } else if (authResult.user!.role === 'seller' || authResult.user!.role === 'farmer') {
      senderRole = 'seller';
    }

    // Get receiver details
    let receiverId: string;
    let receiverName: string;
    let receiverRole: 'buyer' | 'seller' | 'admin';

    if (isAdmin) {
      // Admin is sending, receiver is the user
      receiverId = conversation.userId;
      receiverName = conversation.userName;
      receiverRole = conversation.userRole as 'buyer' | 'seller' | 'admin';
    } else {
      // User is sending, receiver is admin
      receiverId = 'admin';
      receiverName = 'Support Team';
      receiverRole = 'admin';
    }

    // Create new message with all required fields
    const newMessage = new ChatMessage({
      conversationId: `support_${conversationId}`, // Required field - use support prefix
      supportConversationId: conversationId, // For filtering support messages
      senderId: authResult.user!.id,
      senderName: user.name || user.email,
      senderRole,
      receiverId,
      receiverName, // FIXED: Now we're setting receiverName
      receiverRole,
      message: message.trim(),
      isRead: false,
      createdAt: new Date()
    });

    await newMessage.save();

    // Update conversation with last message info
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = message.trim().substring(0, 200);
    if (conversation.status === 'open' && isAdmin) {
      conversation.status = 'in_progress';
    }
    await conversation.save();

    // Format response
    const responseMessage = {
      _id: newMessage._id.toString(),
      senderId: newMessage.senderId,
      senderName: newMessage.senderName,
      senderRole: newMessage.senderRole,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
      isRead: newMessage.isRead
    };

    return NextResponse.json({
      success: true,
      message: responseMessage
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}