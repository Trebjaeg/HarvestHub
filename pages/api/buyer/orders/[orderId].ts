import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (req.method === 'GET') {
    return getOrderDetails(req, res, orderId as string);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function getOrderDetails(req: NextApiRequest, res: NextApiResponse, orderId: string) {
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

    // Validate orderId format
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Connect to database
    await dbConnect();

    // Find the order with optimized query
    const order = await Order.findOne({ 
      _id: orderId, 
      buyerId: buyerId 
    })
    .select('orderNumber orderDate products totalAmount deliveryFee finalAmount status paymentStatus paymentMethod estimatedDelivery actualDelivery deliveryAddress sellerId sellerName notes createdAt updatedAt')
    .lean()
    .exec();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or access denied' 
      });
    }

    // Generate tracking timeline based on order status
    const generateTrackingTimeline = (orderData: any) => {
      const baseSteps = [
        {
          status: 'pending',
          title: 'Order Placed',
          description: 'Your order has been received and is being processed',
          timestamp: orderData.orderDate,
          completed: true
        },
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          description: 'Seller has confirmed your order and will start preparing it',
          timestamp: orderData.status === 'confirmed' || 
                    ['preparing', 'shipped', 'delivered', 'completed'].includes(orderData.status) 
                    ? orderData.updatedAt : null,
          completed: ['confirmed', 'preparing', 'shipped', 'delivered', 'completed'].includes(orderData.status)
        },
        {
          status: 'preparing',
          title: 'Preparing Order',
          description: 'Your order is being prepared for shipment',
          timestamp: orderData.status === 'preparing' || 
                    ['shipped', 'delivered', 'completed'].includes(orderData.status) 
                    ? orderData.updatedAt : null,
          completed: ['preparing', 'shipped', 'delivered', 'completed'].includes(orderData.status)
        },
        {
          status: 'shipped',
          title: 'Order Shipped',
          description: 'Your order is on its way to your delivery address',
          timestamp: orderData.status === 'shipped' || 
                    ['delivered', 'completed'].includes(orderData.status) 
                    ? orderData.updatedAt : null,
          completed: ['shipped', 'delivered', 'completed'].includes(orderData.status)
        },
        {
          status: 'delivered',
          title: 'Order Delivered',
          description: 'Your order has been successfully delivered',
          timestamp: orderData.actualDelivery || 
                    (orderData.status === 'delivered' || orderData.status === 'completed' 
                     ? orderData.updatedAt : null),
          completed: ['delivered', 'completed'].includes(orderData.status)
        }
      ];

      // Handle cancelled orders
      if (orderData.status === 'cancelled') {
        return [
          baseSteps[0], // Order placed
          {
            status: 'cancelled',
            title: 'Order Cancelled',
            description: 'This order has been cancelled',
            timestamp: orderData.updatedAt,
            completed: true
          }
        ];
      }

      return baseSteps;
    };

    // Format comprehensive order details for response
    const formattedOrder = {
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toISOString(),
      products: order.products.map(product => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        unit: product.unit,
        category: product.category || 'general',
        subtotal: product.price * product.quantity
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      finalAmount: order.finalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
      actualDelivery: order.actualDelivery ? order.actualDelivery.toISOString() : null,
      deliveryAddress: {
        street: order.deliveryAddress.street,
        city: order.deliveryAddress.city,
        province: order.deliveryAddress.province,
        zipCode: order.deliveryAddress.zipCode,
        fullAddress: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province} ${order.deliveryAddress.zipCode}`
      },
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      notes: order.notes || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      
      // Computed fields for frontend convenience
      totalItems: order.products.reduce((sum, p) => sum + p.quantity, 0),
      canCancel: ['pending', 'confirmed'].includes(order.status),
      canTrack: ['confirmed', 'preparing', 'shipped'].includes(order.status),
      canContactSeller: !['cancelled', 'completed'].includes(order.status),
      isActive: !['cancelled', 'completed', 'delivered'].includes(order.status),
      
      // Tracking timeline
      trackingSteps: generateTrackingTimeline(order),
      
      // Order summary
      summary: {
        itemCount: order.products.length,
        totalQuantity: order.products.reduce((sum, p) => sum + p.quantity, 0),
        avgItemPrice: order.totalAmount / order.products.reduce((sum, p) => sum + p.quantity, 0),
        hasDeliveryFee: order.deliveryFee > 0,
        savings: 0 // Can be calculated if there are discounts
      }
    };

    res.status(200).json({
      success: true,
      data: {
        order: formattedOrder,
        meta: {
          timestamp: new Date().toISOString(),
          buyerId,
          orderId
        }
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    
    // Enhanced error handling
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid order ID format';
      statusCode = 400;
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