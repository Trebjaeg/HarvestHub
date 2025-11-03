import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportConversation from '@/models/SupportConversation';
import ChatMessage from '@/models/ChatMessage';

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
    
    return { 
      success: true, 
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'buyer'
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}

// DELETE /api/support/clear-conversations - Clear all conversations for current user
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Delete all support conversations for this user
    const deleteConversations = await SupportConversation.deleteMany({
      userId: authResult.user!.id
    });

    // Delete all related messages
    const deleteMessages = await ChatMessage.deleteMany({
      senderId: authResult.user!.id,
      supportConversationId: { $exists: true }
    });

    return NextResponse.json({
      success: true,
      message: 'All conversations cleared successfully',
      deleted: {
        conversations: deleteConversations.deletedCount,
        messages: deleteMessages.deletedCount
      }
    });

  } catch (error) {
    console.error('Error clearing conversations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear conversations' },
      { status: 500 }
    );
  }
}