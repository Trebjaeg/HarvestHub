import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import SupportTicket from '../../../../models/SupportTicket';
import User from '../../../../models/User';

// Enhanced token verification for better compatibility
async function verifyAuth(request: NextRequest) {
  try {
    // Try to get token from multiple sources
    let token = request.cookies.get('auth-token')?.value || 
                request.cookies.get('token')?.value;
    
    // If no cookie token, try Authorization header
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
      console.error('JWT_SECRET not configured');
      return { success: false, error: 'Server configuration error' };
    }

    const decoded = jwt.verify(token, secret) as any;
    
    return { 
      success: true, 
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      }
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Invalid or expired token' };
  }
}

// GET /api/support/[id] - Get specific ticket details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const ticket = await SupportTicket.findById(id).lean();
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user owns this ticket or is admin
    if (ticket.userId !== authResult.user!.id && !['admin', 'superadmin'].includes(authResult.user!.role)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Filter out internal messages for non-admin users
    const filteredTicket = {
      ...ticket,
      _id: ticket._id.toString(),
      messages: ticket.messages.filter((msg: any) => 
        ['admin', 'superadmin'].includes(authResult.user!.role) || !msg.isInternal
      ).map((msg: any) => ({
        ...msg,
        createdAt: msg.createdAt || new Date().toISOString()
      }))
    };

    return NextResponse.json({
      success: true,
      data: { ticket: filteredTicket }
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PATCH /api/support/[id] - Update ticket (add message, change status, rate, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await request.json();
    const { action } = body;

    const { id } = await params;
    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user owns this ticket or is admin
    const isOwner = ticket.userId === authResult.user!.id;
    const isAdmin = ['admin', 'superadmin'].includes(authResult.user!.role);
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get user details for message attribution
    const user = await User.findById(authResult.user!.id).select('name email role');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'add_message':
        const { content } = body;
        
        if (!content?.trim()) {
          return NextResponse.json(
            { success: false, message: 'Message content is required' },
            { status: 400 }
          );
        }

        // Add new message
        const newMessage = {
          messageId: `msg_${Date.now()}_${ticket.messages.length + 1}`,
          senderId: authResult.user!.id,
          senderType: isAdmin ? 'admin' : 'user',
          senderName: user.name,
          content: content.trim(),
          isInternal: false,
          createdAt: new Date()
        };

        ticket.messages.push(newMessage);
        
        // Update metadata
        ticket.metadata.lastResponseBy = authResult.user!.id;
        ticket.metadata.lastResponseAt = new Date();

        // If admin responds, mark as in_progress
        if (isAdmin && ticket.status === 'pending') {
          ticket.status = 'in_progress';
        }

        await ticket.save();
        break;

      case 'rate':
        const { satisfaction } = body;
        
        if (!isOwner) {
          return NextResponse.json(
            { success: false, message: 'Only ticket owner can rate' },
            { status: 403 }
          );
        }

        if (!satisfaction?.rating || satisfaction.rating < 1 || satisfaction.rating > 5) {
          return NextResponse.json(
            { success: false, message: 'Valid rating (1-5) is required' },
            { status: 400 }
          );
        }

        ticket.satisfaction = {
          rating: satisfaction.rating,
          feedback: satisfaction.feedback?.trim() || '',
          submittedAt: new Date()
        };

        await ticket.save();
        break;

      case 'reopen':
        if (!isOwner) {
          return NextResponse.json(
            { success: false, message: 'Only ticket owner can reopen' },
            { status: 403 }
          );
        }

        if (!['resolved', 'closed'].includes(ticket.status)) {
          return NextResponse.json(
            { success: false, message: 'Only resolved or closed tickets can be reopened' },
            { status: 400 }
          );
        }

        ticket.status = 'reopened';
        ticket.metadata.reopenCount += 1;
        ticket.resolvedAt = undefined;
        ticket.closedAt = undefined;

        // Add system message
        ticket.messages.push({
          messageId: `msg_${Date.now()}_system`,
          senderId: 'system',
          senderType: 'admin',
          senderName: 'System',
          content: `Ticket reopened by ${user.name}`,
          isInternal: false,
          createdAt: new Date()
        });

        await ticket.save();
        break;

      case 'update_status':
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, message: 'Only admins can update status' },
            { status: 403 }
          );
        }

        const { status, reason } = body;
        
        if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
          return NextResponse.json(
            { success: false, message: 'Valid status is required' },
            { status: 400 }
          );
        }

        const oldStatus = ticket.status;
        ticket.status = status;

        // Update timestamps
        if (status === 'resolved') {
          ticket.resolvedAt = new Date();
        } else if (status === 'closed') {
          ticket.closedAt = new Date();
        }

        // Add system message
        ticket.messages.push({
          messageId: `msg_${Date.now()}_system`,
          senderId: authResult.user!.id,
          senderType: 'admin',
          senderName: user.name,
          content: `Status changed from ${oldStatus} to ${status}${reason ? `: ${reason}` : ''}`,
          isInternal: false,
          createdAt: new Date()
        });

        await ticket.save();
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    // Return updated ticket
    const updatedTicket = await SupportTicket.findById(id).lean();
    
    const filteredTicket = {
      ...updatedTicket,
      _id: updatedTicket!._id.toString(),
      messages: updatedTicket!.messages.filter((msg: any) => 
        isAdmin || !msg.isInternal
      ).map((msg: any) => ({
        ...msg,
        createdAt: msg.createdAt || new Date().toISOString()
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: filteredTicket }
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// DELETE /api/support/[id] - Delete ticket (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can delete tickets
    if (!['admin', 'superadmin'].includes(authResult.user!.role)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    await SupportTicket.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}