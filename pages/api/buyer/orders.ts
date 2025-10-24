import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token from multiple sources
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to database with performance optimization
    await dbConnect();

    // Parse and validate query parameters
    const {
      page = '1',
      limit = '10',
      status,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10)); // Cap at 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build optimized filter query
    const filter: any = { buyerId };

    // Add status filter
    if (status && status !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'];
      if (validStatuses.includes(status as string)) {
        filter.status = status;
      }
    }

    // Add category filter (filter by product categories)
    if (category && category !== 'all') {
      filter['products.category'] = { $regex: category, $options: 'i' };
    }

    // Add date range filter with optimization
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          filter.orderDate.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          // Set to end of day
          end.setHours(23, 59, 59, 999);
          filter.orderDate.$lte = end;
        }
      }
    }

    // Add text search filter with indexed fields
    if (search && search.trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { sellerName: { $regex: searchTerm, $options: 'i' } },
        { 'products.productName': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Build sort object with validation
    const validSortFields = ['orderDate', 'finalAmount', 'status', 'orderNumber'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'orderDate';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDirection };

    // Execute optimized queries in parallel
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('orderNumber orderDate products totalAmount deliveryFee finalAmount status paymentStatus estimatedDelivery actualDelivery sellerName')
        .lean()
        .exec(),
      Order.countDocuments(filter).exec()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalOrders / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format orders for frontend consumption
    const formattedOrders = orders.map(order => ({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toISOString(),
      products: order.products.map(product => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        unit: product.unit,
        category: product.category || 'general'
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      finalAmount: order.finalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
      actualDelivery: order.actualDelivery ? order.actualDelivery.toISOString() : null,
      sellerName: order.sellerName,
      // Computed fields for frontend
      totalItems: order.products.reduce((sum, p) => sum + p.quantity, 0),
      canCancel: ['pending', 'confirmed'].includes(order.status),
      canTrack: ['confirmed', 'preparing', 'shipped'].includes(order.status)
    }));

    // Enhanced response with metadata
    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalOrders,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
          startIndex: skip + 1,
          endIndex: Math.min(skip + limitNum, totalOrders)
        },
        filters: {
          status: status || 'all',
          category: category || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
          search: search || '',
          sortBy: sortField,
          sortOrder: sortOrder || 'desc'
        },
        meta: {
          timestamp: new Date().toISOString(),
          buyerId,
          queryExecutionTime: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    
    // Enhanced error handling
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}