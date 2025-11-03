import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportConversation from '@/models/SupportConversation';
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

// GET /api/support/conversation - Get existing support conversation for current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find the most recent active conversation for this user
    const conversation = await SupportConversation.findOne({
      userId: authResult.user!.id,
      status: { $in: ['open', 'in_progress'] }
    }).sort({ createdAt: -1 });

    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'No active conversation found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        _id: conversation._id.toString(),
        userId: conversation.userId,
        userName: conversation.userName,
        userEmail: conversation.userEmail,
        userRole: conversation.userRole,
        status: conversation.status,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// POST /api/support/conversation - Create new support conversation
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user already has an open conversation
    const existingConversation = await SupportConversation.findOne({
      userId: authResult.user!.id,
      status: { $in: ['open', 'in_progress'] }
    }).sort({ createdAt: -1 });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversation: {
          _id: existingConversation._id.toString(),
          userId: existingConversation.userId,
          userName: existingConversation.userName,
          userEmail: existingConversation.userEmail,
          userRole: existingConversation.userRole,
          status: existingConversation.status,
          createdAt: existingConversation.createdAt,
          lastMessageAt: existingConversation.lastMessageAt
        }
      });
    }

    // Get user details
    const user = await User.findById(authResult.user!.id).select('name email role');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create new support conversation
    const newConversation = new SupportConversation({
      userId: authResult.user!.id,
      userName: user.name || user.email,
      userEmail: user.email,
      userRole: user.role === 'seller' || user.role === 'farmer' ? 'seller' : 'buyer',
      status: 'open',
      priority: 'medium',
      lastMessageAt: new Date()
    });

    await newConversation.save();

    return NextResponse.json({
      success: true,
      conversation: {
        _id: newConversation._id.toString(),
        userId: newConversation.userId,
        userName: newConversation.userName,
        userEmail: newConversation.userEmail,
        userRole: newConversation.userRole,
        status: newConversation.status,
        createdAt: newConversation.createdAt,
        lastMessageAt: newConversation.lastMessageAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}