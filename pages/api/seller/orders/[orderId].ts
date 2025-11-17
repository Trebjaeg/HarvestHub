import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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
      return res.status(401).json({ message: 'Authentication required' });
    }

    let sellerId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; id?: string };
      sellerId = decoded.userId || decoded.id;
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find order and verify it belongs to the seller
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the seller of this order
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch buyer and seller contact information from User model
    let buyerPhone = null;
    let sellerFullName = null;
    let sellerEmail = null;
    let sellerPhone = null;
    
    try {
      const User = (await import('../../../../models/User')).default;
      
      // Fetch buyer info
      if ((order as any).buyerId) {
        const buyer = await User.findById((order as any).buyerId)
          .select('phone')
          .lean()
          .exec();
        if (buyer) {
          buyerPhone = (buyer as any).phone;
        }
      }
      
      // Fetch seller info
      if ((order as any).sellerId) {
        const seller = await User.findById((order as any).sellerId)
          .select('name firstName lastName email phone')
          .lean()
          .exec();
        
        if (seller) {
          const sellerData = seller as { name?: string; firstName?: string; lastName?: string; email?: string; phone?: string };
          sellerFullName = sellerData.name || 
                          `${sellerData.firstName || ''} ${sellerData.lastName || ''}`.trim() || 
                          null;
          sellerEmail = sellerData.email;
          sellerPhone = sellerData.phone;
        }
      }
    } catch (err) {
      console.error('Error fetching user contact information:', err);
    }

    const orderData = order as any;
    
    return res.status(200).json({
      order: {
        _id: orderData._id.toString(),
        orderNumber: orderData.orderNumber,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        buyerEmail: orderData.buyerEmail,
        buyerPhone: buyerPhone,
        sellerId: orderData.sellerId,
        sellerName: orderData.sellerName,
        sellerFullName: sellerFullName,
        sellerEmail: sellerEmail,
        sellerPhone: sellerPhone,
        products: orderData.products,
        totalAmount: orderData.totalAmount,
        deliveryFee: orderData.deliveryFee,
        finalAmount: orderData.finalAmount,
        deliveryAddress: orderData.deliveryAddress,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        orderDate: orderData.orderDate,
        estimatedDelivery: orderData.estimatedDelivery,
        actualDelivery: orderData.actualDelivery,
        notes: orderData.notes,
        // Include Lalamove tracking data
        lalamove_order_id: orderData.lalamove_order_id,
        lalamove_quotation_id: orderData.lalamove_quotation_id,
        lalamove_share_link: orderData.lalamove_share_link,
        // Include cancellation request data
        cancellationRequest: orderData.cancellationRequest ? {
          requestedBy: orderData.cancellationRequest.requestedBy,
          reason: orderData.cancellationRequest.reason,
          requestedAt: orderData.cancellationRequest.requestedAt,
          status: orderData.cancellationRequest.status
        } : undefined
      }
    });
  } catch (error) {
    console.error('Error fetching seller order details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}