import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import SupportTicket from '../../../../../../models/SupportTicket';
import { verifyAdminAuth } from '../../../../../../lib/admin-auth-server';

// POST /api/admin/support/[id]/respond - Admin responds to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    await dbConnect();

    const { content, isInternal = false, status } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Add admin response to messages
    const newMessage = {
      messageId: `msg_${Date.now()}_${ticket.messages.length + 1}`,
      senderId: admin._id.toString(),
      senderType: 'admin' as const,
      senderName: admin.name,
      content: content.trim(),
      isInternal: isInternal || false,
      createdAt: new Date()
    };

    ticket.messages.push(newMessage);

    // Update ticket status if provided
    if (status && status !== ticket.status) {
      ticket.status = status as 'pending' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
      
      // If resolving, update resolved date
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = admin._id;
        ticket.resolvedByName = admin.name;
      }
    }

    // Update assignment if not already assigned
    if (!ticket.assignedTo) {
      ticket.assignedTo = admin._id;
      ticket.assignedAdminName = admin.name;
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id).lean();

    return NextResponse.json({
      success: true,
      data: { 
        ticket: {
          ...populatedTicket,
          priority: populatedTicket.priority as 'low' | 'medium' | 'high' | 'urgent'
        }
      }
    });

  } catch (error) {
    console.error('Error responding to ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to respond to ticket' },
      { status: 500 }
    );
  }
}