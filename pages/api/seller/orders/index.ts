import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set no-cache headers for real-time data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const sellerId = decoded.userId || decoded.id;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    // Parse query parameters
    const {
      page = '1',
      limit = '10',
      status,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = { sellerId };

    // Add status filter
    if (status && status !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'];
      if (validStatuses.includes(status as string)) {
        filter.status = status;
      }
    }

    // Add date range filter
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
          end.setHours(23, 59, 59, 999);
          filter.orderDate.$lte = end;
        }
      }
    }

    // Add text search
    const searchStr: string = Array.isArray(search) ? search[0] : (search || '');
    if (searchStr && searchStr.trim()) {
      const searchTerm = searchStr.trim();
      filter.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { buyerName: { $regex: searchTerm, $options: 'i' } },
        { 'products.productName': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Build sort
    const validSortFields = ['orderDate', 'finalAmount', 'status', 'orderNumber'];
    const sortFieldStr = String(validSortFields.includes(sortBy as string) ? sortBy : 'orderDate');
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortFieldStr]: sortDirection };

    // Execute queries in parallel
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limitNum)
        .select('orderNumber orderDate buyerName buyerEmail products totalAmount deliveryFee finalAmount status paymentStatus deliveryAddress estimatedDelivery actualDelivery cancellationRequest refusalReason refusalDate refusalProof deliveryAttempts')
        .lean()
        .exec(),
      Order.countDocuments(filter).exec()
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalOrders / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format orders
    const formattedOrders = orders.map((order: any) => ({
      _id: String(order._id),
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toISOString(),
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      products: order.products.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        unit: product.unit
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      finalAmount: order.finalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      cancellationRequest: order.cancellationRequest ? {
        requestedBy: order.cancellationRequest.requestedBy,
        reason: order.cancellationRequest.reason,
        requestedAt: order.cancellationRequest.requestedAt.toISOString(),
        status: order.cancellationRequest.status
      } : undefined,
      refusalReason: order.refusalReason,
      refusalDate: order.refusalDate ? order.refusalDate.toISOString() : null,
      refusalProof: order.refusalProof,
      deliveryAttempts: order.deliveryAttempts,
      estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
      actualDelivery: order.actualDelivery ? order.actualDelivery.toISOString() : null,
      totalItems: order.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
      canPrepare: order.status === 'pending',
      canShip: order.status === 'preparing',
      canComplete: order.status === 'delivered',
      canCancel: ['pending'].includes(order.status)
    }));

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
          startDate: startDate || null,
          endDate: endDate || null,
          search: search || '',
          sortBy: sortFieldStr,
          sortOrder: sortOrder || 'desc'
        }
      }
    });

  } catch (error) {
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
      message: errorMessage
    });
  }
}
