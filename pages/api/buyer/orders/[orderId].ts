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
  // Set no-cache headers for real-time data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

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
    .select('orderNumber orderDate products totalAmount deliveryFee finalAmount status paymentStatus paymentMethod estimatedDelivery actualDelivery deliveryAddress sellerId sellerName buyerId buyerName buyerEmail refusalReason refusalDate refusalProof cancellationRequest createdAt updatedAt')
    .lean()
    .exec();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or access denied' 
      });
    }

    // Fetch buyer phone number from User collection
    const User = (await import('../../../../models/User')).default;
    const buyer = await User.findById(buyerId)
      .select('phone')
      .lean()
      .exec();

    // Fetch product images from Product collection
    const Product = (await import('../../../../models/Product')).default;
    const productIds = (order as any).products.map((p: any) => p.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id image')
      .lean()
      .exec();
    
    // Create a map of productId to image URL
    const productImageMap = products.reduce((map: any, product: any) => {
      map[product._id.toString()] = product.image;
      return map;
    }, {});

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
        // Determine the last completed step before cancellation
        const stepsBeforeCancellation = [];
        stepsBeforeCancellation.push(baseSteps[0]); // Order placed always included
        
        // Add preparing step if it was reached
        if (orderData.refusalReason) {
          // If refused, it must have been shipped
          stepsBeforeCancellation.push({
            ...baseSteps[1],
            completed: true
          });
          stepsBeforeCancellation.push({
            ...baseSteps[2],
            completed: true
          });
        }
        
        // Add cancellation/refusal step
        stepsBeforeCancellation.push({
          status: 'cancelled',
          title: orderData.refusalReason ? 'Delivery Refused' : 'Order Cancelled',
          description: orderData.refusalReason 
            ? `You refused delivery: ${orderData.refusalReason}` 
            : 'This order has been cancelled',
          timestamp: orderData.refusalDate || orderData.updatedAt,
          completed: true
        });
        
        return stepsBeforeCancellation;
      }

      return baseSteps;
    };

    // Format comprehensive order details for response
    const orderData = order as any;
    const formattedOrder = {
      _id: orderData._id.toString(),
      orderNumber: orderData.orderNumber,
      orderDate: orderData.orderDate.toISOString(),
      products: orderData.products.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        unit: product.unit,
        category: product.category || 'general',
        subtotal: product.price * product.quantity,
        image: productImageMap[product.productId] || null
      })),
      totalAmount: orderData.totalAmount,
      deliveryFee: orderData.deliveryFee,
      finalAmount: orderData.finalAmount,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      estimatedDelivery: orderData.estimatedDelivery ? orderData.estimatedDelivery.toISOString() : null,
      actualDelivery: orderData.actualDelivery ? orderData.actualDelivery.toISOString() : null,
      deliveryAddress: {
        street: orderData.deliveryAddress.street,
        city: orderData.deliveryAddress.city,
        province: orderData.deliveryAddress.province,
        zipCode: orderData.deliveryAddress.zipCode,
        fullName: orderData.deliveryAddress.fullName,
        phone: orderData.deliveryAddress.phone,
        fullAddress: `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.province} ${orderData.deliveryAddress.zipCode}`
      },
      buyerId: orderData.buyerId,
      buyerName: orderData.buyerName,
      buyerEmail: orderData.buyerEmail,
      buyerPhone: buyer?.phone || orderData.deliveryAddress?.phone || null,
      sellerId: orderData.sellerId,
      sellerName: orderData.sellerName,
      notes: orderData.notes || null,
      refusalReason: orderData.refusalReason || null,
      refusalDate: orderData.refusalDate ? orderData.refusalDate.toISOString() : null,
      cancellationRequest: orderData.cancellationRequest ? {
        requestedBy: orderData.cancellationRequest.requestedBy,
        reason: orderData.cancellationRequest.reason || null,
        requestedAt: orderData.cancellationRequest.requestedAt.toISOString(),
        status: orderData.cancellationRequest.status
      } : null,
      createdAt: orderData.createdAt.toISOString(),
      updatedAt: orderData.updatedAt.toISOString(),
      
      // Computed fields for frontend convenience
      totalItems: orderData.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
      canCancel: ['pending', 'confirmed', 'preparing', 'shipped'].includes(orderData.status) && !orderData.cancellationRequest?.status,
      canTrack: ['preparing', 'shipped'].includes(orderData.status),
      canContactSeller: !['cancelled', 'completed'].includes(orderData.status),
      isActive: !['cancelled', 'completed', 'delivered'].includes(orderData.status),
      
      // Tracking timeline
      trackingSteps: generateTrackingTimeline(order),
      
      // Order summary
      summary: {
        itemCount: orderData.products.length,
        totalQuantity: orderData.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
        avgItemPrice: orderData.totalAmount / orderData.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
        hasDeliveryFee: orderData.deliveryFee > 0,
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

    const err = error as any;
    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid order ID format';
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack
      } : undefined
    });
  }
}