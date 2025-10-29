import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import SupportTicket from '../../../../models/SupportTicket';
import User from '../../../../models/User';

// Enhanced token verification for admin routes
async function verifyAdminAuth(request: NextRequest) {
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
    
    // Check if user has admin role
    if (!['admin', 'superadmin'].includes(decoded.role)) {
      return { success: false, error: 'Admin access required' };
    }
    
    return { 
      success: true, 
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Invalid or expired token' };
  }
}

// GET /api/admin/support - Get all support tickets with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build filter query
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Format tickets for response
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      _id: ticket._id.toString(),
      messages: ticket.messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt || new Date().toISOString()
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        tickets: formattedTickets,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/admin/support - Create ticket on behalf of user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { 
      userId, 
      subject, 
      description, 
      category, 
      priority = 'medium',
      userEmail 
    } = body;

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

    // Get user details or use provided email
    let user = null;
    let userName = 'Admin Created';
    let userType = 'buyer';
    
    if (userId) {
      user = await User.findById(userId).select('name email role');
      if (user) {
        userName = user.name;
        userType = (user.role === 'seller' || user.role === 'farmer') ? 'seller' : 'buyer';
      }
    }

    // Generate ticket number
    const ticketCount = await SupportTicket.countDocuments();
    const ticketNumber = `SUP-${Date.now()}-${String(ticketCount + 1).padStart(4, '0')}`;

    // Create the support ticket
    const supportTicket = new SupportTicket({
      ticketNumber,
      userId: userId || 'admin-created',
      userType,
      userName,
      userEmail: user?.email || userEmail || 'admin@harvesthub.com',
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      status: 'pending',
      assignedTo: authResult.user!.id,
      tags: [],
      messages: [{
        messageId: `msg_${Date.now()}_1`,
        senderId: userId || authResult.user!.id,
        senderType: userId ? 'user' : 'admin',
        senderName: userName,
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
                   'admin',
        browserInfo: request.headers.get('user-agent') || 'admin-created'
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

    console.log('Admin created support ticket:', {
      ticketNumber: savedTicket.ticketNumber,
      adminId: authResult.user!.id,
      subject: subject.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket: ticketResponse }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}