import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { messageId } = params;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      recipientId: userId,
      recipientType: 'buyer'
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { messageId } = params;
    const body = await request.json();
    const { action } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      recipientId: userId,
      recipientType: 'buyer'
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'mark_read':
        if (!message.isRead) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();
        }
        break;

      case 'mark_unread':
        message.isRead = false;
        message.readAt = null;
        await message.save();
        break;

      case 'archive':
        message.isArchived = true;
        await message.save();
        break;

      case 'unarchive':
        message.isArchived = false;
        await message.save();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Message ${action.replace('_', ' ')} successfully`,
      data: message
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { messageId } = params;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Find and archive message (soft delete)
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        recipientId: userId,
        recipientType: 'buyer'
      },
      { 
        isArchived: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message archived successfully'
    });

  } catch (error) {
    console.error('Error archiving message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}