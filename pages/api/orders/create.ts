import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import CartItem from '@/models/CartItem';
import User from '@/models/User';
import Product from '@/models/Product';
import ChatMessage, { generateConversationId } from '@/models/ChatMessage';
import jwt from 'jsonwebtoken';
import emailService from '@/lib/email-service';
import inventoryManager from '@/lib/inventory-manager';
import mongoose from 'mongoose';
import { notifyNewOrder } from '@/lib/notification-utils';
import { emitNewMessage } from '@/lib/socket-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timeout - order creation is taking too long' });
    }
  }, 20000); // 20 second timeout for complex order creation

  try {
    // Get user from auth token
    const token = req.cookies['auth-token'];
    if (!token) {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { items, shippingAddress, paymentMethod, subtotal, shippingFee, total } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      clearTimeout(timeoutId);
      return res.status(400).json({ message: 'No items provided' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
        !shippingAddress.street || !shippingAddress.city || !shippingAddress.province) {
      clearTimeout(timeoutId);
      return res.status(400).json({ message: 'Incomplete shipping address' });
    }

    if (!paymentMethod) {
      clearTimeout(timeoutId);
      return res.status(400).json({ message: 'Payment method not specified' });
    }

    // Get buyer details - optimized with lean() and timeout
    const buyer = await User.findById(userId)
      .select('fullName email')
      .maxTimeMS(2000)
      .lean()
      .exec();
    if (!buyer) {
      clearTimeout(timeoutId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Group items by seller
    const itemsBySeller = new Map<string, typeof items>();
    const allSellerIds = new Set<string>();
    const allProductIds = new Set<string>();
    
    for (const item of items) {
      if (!itemsBySeller.has(item.sellerId)) {
        itemsBySeller.set(item.sellerId, []);
      }
      itemsBySeller.get(item.sellerId)!.push(item);
      allSellerIds.add(item.sellerId);
      allProductIds.add(item.productId);
    }

    // Fetch all sellers and products in parallel - MAJOR OPTIMIZATION
    const [sellers, products] = await Promise.all([
      User.find({ _id: { $in: Array.from(allSellerIds) } })
        .select('fullName email')
        .maxTimeMS(3000)
        .lean()
        .exec(),
      Product.find({ _id: { $in: Array.from(allProductIds) } })
        .select('name unit')
        .maxTimeMS(3000)
        .lean()
        .exec()
    ]);

    // Create maps for O(1) lookup
    const sellerMap = new Map(sellers.map(s => [s._id.toString(), s]));
    const productMap = new Map(products.map(p => [(p._id as any).toString(), p]));

    const createdOrders: string[] = [];
    const ordersToCreate: any[] = [];
    const allOrderItems: Array<{ productId: string; quantity: number }> = [];

    // Prepare all orders (without saving yet)
    for (const [sellerId, sellerItems] of itemsBySeller) {
      const seller = sellerMap.get(sellerId);
      if (!seller) {
        console.warn(`Seller ${sellerId} not found, skipping...`);
        continue;
      }

      const productsWithDetails = sellerItems.map((item: any) => {
        const product = productMap.get(item.productId);
        // Collect items for inventory reservation
        allOrderItems.push({ productId: item.productId, quantity: item.quantity });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.pricePerUnit,
          unit: product?.unit || 'pcs'
        };
      });

      // Calculate order total for this seller
      const orderSubtotal = sellerItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.pricePerUnit), 0);

      ordersToCreate.push({
        orderNumber: generateOrderNumber(),
        buyerId: userId,
        buyerName: (buyer as any).fullName || buyer.email,
        buyerEmail: buyer.email,
        sellerId: sellerId,
        sellerName: (seller as any).fullName || seller.email,
        products: productsWithDetails,
        totalAmount: orderSubtotal,
        deliveryFee: shippingFee,
        finalAmount: orderSubtotal + shippingFee,
        deliveryAddress: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          province: shippingAddress.province,
          zipCode: shippingAddress.zipCode || 'N/A'
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        status: 'preparing',
        orderDate: new Date()
      });
    }

    // Start a transaction for atomic inventory reservation + order creation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Reserve inventory (atomic operation)
      const reserveResult = await inventoryManager.reserveInventory(allOrderItems, session);
      
      if (!reserveResult.success) {
        await session.abortTransaction();
        clearTimeout(timeoutId);
        return res.status(400).json({ 
          message: 'Insufficient inventory for some items',
          details: reserveResult.failedItems
        });
      }

      // Step 2: Create orders (within transaction)
      const insertedOrders = await Order.insertMany(ordersToCreate, { session });
      createdOrders.push(...insertedOrders.map(o => o._id.toString()));

      // Commit transaction - both inventory reservation and order creation succeed together
      await session.commitTransaction();

      // Send notifications to sellers (asynchronous, don't block response)
      insertedOrders.forEach(order => {
        const productNames = order.products.map((p: any) => p.productName);
        notifyNewOrder(
          order.sellerId,
          order.orderNumber,
          order._id.toString(),
          order.buyerName,
          productNames,
          order.totalAmount
        ).catch(err => console.error('Error sending notification:', err));
      });

      // Create initial chat messages for each order (buyer-seller conversation)
      const chatMessages = insertedOrders.map(order => {
        const conversationId = generateConversationId(userId, order.sellerId);
        const productList = order.products.map((p: any) => `${p.productName} (${p.quantity} ${p.unit})`).join(', ');
        
        return {
          conversationId,
          senderId: userId,
          senderName: order.buyerName,
          senderRole: 'buyer',
          receiverId: order.sellerId,
          receiverName: order.sellerName,
          receiverRole: 'seller',
          message: `Hi! I just placed an order (${order.orderNumber}) for: ${productList}. Total: ₱${order.finalAmount.toFixed(2)}`,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Insert chat messages and emit real-time events
      if (chatMessages.length > 0) {
        ChatMessage.insertMany(chatMessages)
          .then(async (insertedMessages) => {
            // Emit new message events to both buyer and seller in real-time
            for (let i = 0; i < insertedMessages.length; i++) {
              const msg = insertedMessages[i];
              const order = insertedOrders[i];
              
              const messageData = {
                _id: msg._id.toString(),
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                senderRole: msg.senderRole,
                receiverId: msg.receiverId,
                receiverName: msg.receiverName,
                receiverRole: msg.receiverRole,
                message: msg.message,
                isRead: msg.isRead,
                createdAt: msg.createdAt.toISOString(),
              };

              // Emit to seller (receiver) - new conversation notification
              await emitNewMessage(order.sellerId, messageData);
              
              // Emit to buyer (sender) - confirmation they initiated the conversation
              await emitNewMessage(userId, messageData);
            }
          })
          .catch(err => console.error('Error creating chat messages:', err));
      }

      // Send order confirmation email asynchronously (don't wait for it)
      if (buyer.email && insertedOrders.length > 0) {
        // Get the first order for email (or combine all if needed)
        const firstOrder = insertedOrders[0];
      
      // Calculate estimated delivery (7 days from now)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

      emailService.sendOrderConfirmation(buyer.email, {
        orderNumber: firstOrder.orderNumber,
        buyerName: (buyer as any).fullName || buyer.email.split('@')[0],
        products: firstOrder.products.map((p: any) => ({
          productName: p.productName,
          quantity: p.quantity,
          price: p.price,
          unit: p.unit
        })),
        totalAmount: firstOrder.totalAmount,
        deliveryFee: firstOrder.deliveryFee,
        finalAmount: firstOrder.finalAmount,
        deliveryAddress: {
          fullName: shippingAddress.fullName,
          phoneNumber: shippingAddress.phone,
          address: shippingAddress.street,
          barangay: shippingAddress.barangay || 'N/A',
          city: shippingAddress.city,
          province: shippingAddress.province,
          postalCode: shippingAddress.zipCode || 'N/A'
        },
        estimatedDelivery
      }).catch(err => console.error('Error sending order confirmation email:', err));
    }

    // Remove ordered items from cart - run async without blocking response
    const productIds = items.map((item: any) => item.productId);
    CartItem.deleteMany({
      userId,
      productId: { $in: productIds }
    }).catch(err => console.error('Error removing cart items:', err));

    clearTimeout(timeoutId);
    return res.status(200).json({
      message: 'Order(s) placed successfully',
      orderId: createdOrders[0], // Return first order ID for redirect
      orderIds: createdOrders
    });

    } catch (transactionError) {
      // Rollback transaction on any error
      await session.abortTransaction();
      console.error('Transaction error:', transactionError);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Failed to create order. Inventory has been released.',
          error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
        });
      }
    } finally {
      session.endSession();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error creating order:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
