import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter parameters
    const category = searchParams.get('category');
    const isRead = searchParams.get('isRead');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: Record<string, unknown> = { 
      recipientId: userId, 
      recipientType: 'buyer',
      isArchived: false 
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (isRead !== null && isRead !== undefined && isRead !== 'all') {
      query.isRead = isRead === 'true';
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.createdAt as Record<string, Date>).$lte = new Date(dateTo);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sortObject: Record<string, 1 | -1> = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [messages, totalCount, unreadCount] = await Promise.all([
      Message.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(query),
      Message.countDocuments({ 
        recipientId: userId, 
        recipientType: 'buyer', 
        isRead: false,
        isArchived: false 
      })
    ]);

    // Group messages by date for better organization
    const groupedMessages = messages.reduce((groups: Record<string, typeof messages>, message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        messages,
        groupedMessages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        stats: {
          unreadCount,
          totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication (admin or system can send messages)
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientId,
      recipientType = 'buyer',
      senderType = 'system',
      senderName,
      subject,
      content,
      category,
      priority = 'medium',
      relatedOrderId,
      relatedProductId,
      metadata
    } = body;

    // Validation
    if (!recipientId || !subject || !content || !category || !senderName) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipientId, subject, content, category, senderName' 
      }, { status: 400 });
    }

    // Create new message
    const message = new Message({
      recipientId,
      recipientType,
      senderId: senderType !== 'system' ? authResult.user.id : null,
      senderType,
      senderName,
      subject,
      content,
      category,
      priority,
      relatedOrderId,
      relatedProductId,
      metadata,
      isRead: false,
      isArchived: false
    });

    await message.save();

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}