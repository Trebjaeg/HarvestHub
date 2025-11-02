import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Review from '../../../models/Review';
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
      const validStatuses = ['preparing', 'shipped', 'delivered', 'cancelled', 'completed'];
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
    const searchStr: string = Array.isArray(search) ? search[0] : (search || '');
    if (searchStr && typeof searchStr === 'string' && searchStr.trim()) {
      const searchTerm = searchStr.trim();
      filter.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { sellerName: { $regex: searchTerm, $options: 'i' } },
        { 'products.productName': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Build sort object with validation
    const validSortFields = ['orderDate', 'finalAmount', 'status', 'orderNumber'];
    const sortFieldStr = String(validSortFields.includes(sortBy as string) ? sortBy : 'orderDate');
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortFieldStr]: sortDirection };

    // Execute optimized queries in parallel
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limitNum)
        .select('orderNumber orderDate products totalAmount deliveryFee finalAmount status paymentStatus estimatedDelivery actualDelivery sellerName cancellationRequest')
        .lean()
        .exec(),
      Order.countDocuments(filter).exec()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalOrders / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Get all product IDs from orders to check for reviews
    const productIds = orders.flatMap((order: any) => 
      order.products.map((p: any) => p.productId)
    );

    // Fetch all reviews for these products by this buyer in one query
    const existingReviews = await Review.find({
      buyerId,
      productId: { $in: productIds },
      status: { $ne: 'removed' }
    })
      .select('productId')
      .lean()
      .exec();

    // Create a Set of reviewed product IDs for fast lookup
    const reviewedProductIds = new Set(
      existingReviews.map((review: any) => String(review.productId))
    );

    // Format orders for frontend consumption
    const formattedOrders = orders.map((order: any) => {
      // Check if any product in this order has been reviewed
      const hasReview = order.products.some((p: any) => 
        reviewedProductIds.has(String(p.productId))
      );

      return {
        _id: String(order._id),
        orderNumber: order.orderNumber,
        orderDate: order.orderDate.toISOString(),
        products: order.products.map((product: any) => ({
          productId: product.productId,
          productName: product.productName,
          quantity: product.quantity,
          price: product.price,
          unit: product.unit,
          category: product.category || 'general',
          hasReview: reviewedProductIds.has(String(product.productId))
        })),
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        finalAmount: order.finalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
        actualDelivery: order.actualDelivery ? order.actualDelivery.toISOString() : null,
        sellerName: order.sellerName,
        cancellationRequest: order.cancellationRequest ? {
          requestedBy: order.cancellationRequest.requestedBy,
          reason: order.cancellationRequest.reason,
          requestedAt: order.cancellationRequest.requestedAt.toISOString(),
          status: order.cancellationRequest.status
        } : undefined,
        // Computed fields for frontend
        totalItems: order.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
        canCancel: ['preparing'].includes(order.status) && !order.cancellationRequest,
        canTrack: ['preparing', 'shipped'].includes(order.status),
        hasReview
      };
    });

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
          sortBy: sortFieldStr,
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

    const err = error as any;
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: err?.message,
        stack: err?.stack
      } : undefined
    });
  }
}