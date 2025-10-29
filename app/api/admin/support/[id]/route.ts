import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import SupportTicket from '../../../../../models/SupportTicket';
import User from '../../../../../models/User';
import { verifyAdminAuth } from '../../../../../lib/admin-auth-server';

interface TicketUpdate {
  status?: string;
  priority?: string;
  assignedTo?: string;
  tags?: string[];
  flagged?: boolean;
  flagReason?: string;
}

// GET /api/admin/support/[id] - Get specific ticket with user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdminAuth(request);
    await dbConnect();

    const ticket = await SupportTicket.findById(params.id).lean();
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(ticket.userId).select('name email role profilePicture').lean();

    return NextResponse.json({
      success: true,
      data: {
        ticket,
        user
      }
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/support/[id] - Update ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminAuth(request);
    await dbConnect();

    const body = await request.json();
    const { status, priority, assignedTo, tags, flagged, flagReason } = body;

    const ticket = await SupportTicket.findById(params.id);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    const updates: TicketUpdate = {};
    
    if (status && status !== ticket.status) {
      updates.status = status;
      
      // If assigning to admin, update assignment info
      if (status === 'in_progress' && assignedTo) {
        const adminUser = await User.findById(assignedTo);
        if (adminUser) {
          updates.assignedTo = assignedTo;
          updates.assignedAdminName = adminUser.name;
        }
      }
    }

    if (priority && priority !== ticket.priority) {
      updates.priority = priority;
    }

    if (tags && Array.isArray(tags)) {
      updates.tags = tags;
    }

    if (typeof flagged === 'boolean') {
      updates.flagged = flagged;
      if (flagged && flagReason) {
        updates.flagReason = flagReason;
      } else if (!flagged) {
        updates.flagReason = undefined;
      }
    }

    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      params.id,
      { 
        ...updates,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();

    // Log admin action
    console.log(`Admin ${admin.name} updated ticket ${ticket.ticketNumber}:`, updates);

    return NextResponse.json({
      success: true,
      data: { ticket: updatedTicket }
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/support/[id] - Delete ticket (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminAuth(request);
    await dbConnect();

    const ticket = await SupportTicket.findById(params.id);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    await SupportTicket.findByIdAndDelete(params.id);

    // Log admin action
    console.log(`Admin ${admin.name} deleted ticket ${ticket.ticketNumber}`);

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