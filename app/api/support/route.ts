import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import SupportTicket from '../../../models/SupportTicket';
import User from '../../../models/User';

interface TicketFilter {
  userId: string;
  status?: string;
}

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

// GET /api/support - Get user's support tickets
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: TicketFilter = { userId: authResult.user!.id };
    if (status) filter.status = status;

    // Get total count for pagination
    const totalTickets = await SupportTicket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / limit);
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out internal messages for users
    const filteredTickets = tickets.map((ticket: any) => ({
      ...ticket,
      _id: ticket._id.toString(),
      messages: ticket.messages.filter((msg: any) => !msg.isInternal).map((msg: any) => ({
        ...msg,
        createdAt: msg.createdAt || new Date().toISOString()
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        tickets: filteredTickets,
        pagination: {
          currentPage: page,
          totalPages,
          totalTickets,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support - Create new support ticket
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

    const body = await request.json();
    const { subject, description, category, priority = 'medium' } = body;

    // Validate required fields
    if (!subject?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Description is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
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

    // Generate ticket number
    const ticketCount = await SupportTicket.countDocuments();
    const ticketNumber = `SUP-${Date.now()}-${String(ticketCount + 1).padStart(4, '0')}`;

    // Determine user type based on role
    const userType = (user.role === 'seller' || user.role === 'farmer') ? 'seller' : 'buyer';

    // Create the support ticket with all required fields
    const supportTicket = new SupportTicket({
      ticketNumber,
      userId: authResult.user!.id,
      userType,
      userName: user.name,
      userEmail: user.email,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      status: 'pending',
      tags: [],
      messages: [{
        messageId: `msg_${Date.now()}_1`,
        senderId: authResult.user!.id,
        senderType: 'user',
        senderName: user.name,
        content: description.trim(),
        isInternal: false,
        createdAt: new Date()
      }],
      metadata: {
        reopenCount: 0,
        escalated: false,
        flagged: false,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        browserInfo: request.headers.get('user-agent') || 'unknown'
      }
    });

    const savedTicket = await supportTicket.save();

    // Convert to plain object for response
    const ticketResponse = {
      ...savedTicket.toObject(),
      _id: savedTicket._id.toString(),
      messages: savedTicket.messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt || new Date().toISOString()
      }))
    };

    console.log('Support ticket created successfully:', {
      ticketNumber: savedTicket.ticketNumber,
      userId: authResult.user!.id,
      subject: subject.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket: ticketResponse }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create support ticket. Please try again.' },
      { status: 500 }
    );
  }
}