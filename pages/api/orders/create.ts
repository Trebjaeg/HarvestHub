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
import { LalamoveConfig, OrderStatusMapping } from '@/config/lalamove';
import { mockLalamoveService } from '@/services/mock-lalamove';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

interface OrderItem {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  sellerId: string;
}

interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface ProductDoc {
  _id: unknown;
  name: string;
  unit: string;
}

interface SellerDoc {
  _id: unknown;
  fullName?: string;
  email: string;
}

const orderIdempotencyCache = new Map<string, { orderId: string; timestamp: number }>();
const IDEMPOTENCY_TTL = 300000; // 5 minutes

async function createLalamoveOrder(quotationId: string, orderNumber: string) {
  try {
    if (LalamoveConfig.mode === 'SIMULATOR') {
      // Use simulator service
      const lalamoveOrder = await mockLalamoveService.createOrder(
        quotationId,
        `HarvestHub Order ${orderNumber} - Fresh produce delivery`,
        { orderNumber }
      );
      
      return {
        orderId: lalamoveOrder.orderId,
        status: lalamoveOrder.status,
        shareLink: lalamoveOrder.shareLink
      };
    } else {
      // Use live Lalamove API
      const response = await fetch('/api/lalamove/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quotationId,
          remarks: `HarvestHub Order ${orderNumber} - Fresh produce delivery`,
          metadata: { orderNumber }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Lalamove order');
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Failed to create Lalamove order:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timeout - order creation is taking too long' });
    }
  }, 20000);

  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      clearTimeout(timeoutId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { items, shippingAddress, paymentMethod, shippingFee, lalamoveQuotationId, voucher } = req.body;

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

    if (!lalamoveQuotationId) {
      clearTimeout(timeoutId);
      return res.status(400).json({ message: 'Delivery quotation required' });
    }

    const idempotencyKey = `${userId}-${JSON.stringify(items)}-${shippingAddress.street}`;
    const cached = orderIdempotencyCache.get(idempotencyKey);
    if (cached && Date.now() - cached.timestamp < IDEMPOTENCY_TTL) {
      clearTimeout(timeoutId);
      return res.status(200).json({
        message: 'Order already placed',
        orderId: cached.orderId,
        orderIds: [cached.orderId]
      });
    }

    const buyer = await User.findById(userId)
      .select('fullName email')
      .maxTimeMS(2000)
      .lean()
      .exec();
    if (!buyer) {
      clearTimeout(timeoutId);
      return res.status(404).json({ message: 'User not found' });
    }

    const itemsBySeller = new Map<string, OrderItem[]>();
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

    const sellerMap = new Map(sellers.map((s: SellerDoc) => [String(s._id), s]));
    const productMap = new Map(products.map((p: ProductDoc) => [String(p._id), p]));

    const createdOrders: string[] = [];
    const ordersToCreate: Array<{
      orderNumber: string;
      buyerId: string;
      buyerName: string;
      buyerEmail: string;
      sellerId: string;
      sellerName: string;
      products: OrderProduct[];
      totalAmount: number;
      deliveryFee: number;
      finalAmount: number;
      deliveryAddress: Record<string, unknown>;
      paymentMethod: string;
      paymentStatus: string;
      status: string;
      deliveryStatus: string;
      orderDate: Date;
      deliveryProvider: string;
      lalamoveQuotationId?: string;
      lalamoveOrderId?: string;
      lalamoveShareLink?: string;
    }> = [];
    const allOrderItems: Array<{ productId: string; quantity: number }> = [];

    for (const [sellerId, sellerItems] of itemsBySeller) {
      const seller = sellerMap.get(sellerId);
      if (!seller) {
        continue;
      }

      const productsWithDetails = sellerItems.map((item: OrderItem) => {
        const product = productMap.get(item.productId);
        allOrderItems.push({ productId: item.productId, quantity: item.quantity });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.pricePerUnit,
          unit: product?.unit || 'pcs'
        };
      });

      const orderSubtotal = sellerItems.reduce((sum: number, item: OrderItem) => 
        sum + (item.quantity * item.pricePerUnit), 0);

      const sellerDoc = seller as { fullName?: string; email: string };

      ordersToCreate.push({
        orderNumber: generateOrderNumber(),
        buyerId: userId,
        buyerName: (buyer as { fullName?: string; email: string }).fullName || buyer.email,
        buyerEmail: buyer.email,
        sellerId: sellerId,
        sellerName: sellerDoc.fullName || sellerDoc.email,
        products: productsWithDetails,
        totalAmount: orderSubtotal,
        deliveryFee: shippingFee || 0,
        finalAmount: orderSubtotal + (shippingFee || 0),
        deliveryAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          province: shippingAddress.province,
          zipCode: shippingAddress.zipCode || 'N/A',
          latitude: shippingAddress.latitude,
          longitude: shippingAddress.longitude
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        status: 'preparing',
        deliveryStatus: 'preparing',
        orderDate: new Date(),
        deliveryProvider: 'lalamove',
        lalamoveQuotationId: lalamoveQuotationId
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reserveResult = await inventoryManager.reserveInventory(allOrderItems, session);
      
      if (!reserveResult.success) {
        await session.abortTransaction();
        clearTimeout(timeoutId);
        return res.status(400).json({ 
          message: 'Insufficient inventory for some items',
          details: reserveResult.failedItems
        });
      }

      const insertedOrders = await Order.insertMany(ordersToCreate, { session });
      createdOrders.push(...insertedOrders.map(o => o._id.toString()));

      // Check for low stock alerts after order creation
      try {
        const { notifyLowStock } = await import('../../../lib/notification-utils');
        
        for (const item of allOrderItems) {
          const product = await Product.findById(item.productId).select('stock lowStockAlert name unit farmerId').lean();
          if (product && product.stock <= (product.lowStockAlert || 5)) {
            await notifyLowStock(
              product.farmerId,
              product.name,
              item.productId,
              product.stock,
              product.lowStockAlert || 5,
              product.unit || 'pcs'
            );
          }
        }
      } catch (notifyError) {
        console.error('Error checking low stock after order creation:', notifyError);
        // Don't fail the order if notification fails
      }

      // Create Lalamove order for the first order (main order)
      if (lalamoveQuotationId && insertedOrders.length > 0) {
        try {
          const lalamoveOrderResult = await createLalamoveOrder(
            lalamoveQuotationId,
            insertedOrders[0].orderNumber
          );

          // Map Lalamove status to internal delivery status
          const internalDeliveryStatus = OrderStatusMapping[lalamoveOrderResult.status as keyof typeof OrderStatusMapping] || 'dispatching';

          await Order.updateOne(
            { _id: insertedOrders[0]._id },
            {
              $set: {
                lalamoveOrderId: lalamoveOrderResult.orderId,
                lalamoveShareLink: lalamoveOrderResult.shareLink,
                deliveryStatus: internalDeliveryStatus
              }
            },
            { session }
          );
        } catch (lalamoveError) {
          console.error('Lalamove order creation failed:', lalamoveError);
          // Continue with order creation but mark as standard delivery
          await Order.updateOne(
            { _id: insertedOrders[0]._id },
            {
              $set: {
                deliveryProvider: 'standard',
                deliveryStatus: 'preparing'
              }
            },
            { session }
          );
        }
      }

      await session.commitTransaction();

      // Track voucher usage if a voucher was applied (works for BOTH new and old accounts)
      if (voucher && voucher.code && insertedOrders.length > 0) {
        try {
          const Voucher = (await import('@/models/Voucher')).default;
          const voucherUpdateResult = await Voucher.findOneAndUpdate(
            { code: voucher.code.toUpperCase() },
            {
              $inc: { currentUsage: 1 },
              $push: {
                usedBy: {
                  userId: String(userId), // Ensure string for consistent comparison
                  usedAt: new Date(),
                  orderId: insertedOrders[0]._id.toString()
                }
              }
            },
            { new: true } // Return updated document
          );
          
          if (voucherUpdateResult) {
            console.log(`✅ Voucher ${voucher.code} usage tracked for user ${userId} (Total uses: ${voucherUpdateResult.currentUsage})`);
          } else {
            console.warn(`⚠️ Voucher ${voucher.code} not found when trying to track usage`);
          }
        } catch (voucherError) {
          console.error('❌ Error tracking voucher usage:', voucherError);
          // Don't fail the order if voucher tracking fails
        }
      }

      orderIdempotencyCache.set(idempotencyKey, { orderId: createdOrders[0], timestamp: Date.now() });
      if (orderIdempotencyCache.size > 100) {
        const firstKey = orderIdempotencyCache.keys().next().value;
        orderIdempotencyCache.delete(firstKey);
      }

      insertedOrders.forEach(order => {
        const productNames = order.products.map((p: OrderProduct) => p.productName);
        notifyNewOrder(
          order.sellerId,
          order.orderNumber,
          order._id.toString(),
          order.buyerName,
          productNames,
          order.totalAmount
        ).catch(() => {});
      });

      const chatMessages = insertedOrders.map(order => {
        const conversationId = generateConversationId(userId, order.sellerId);
        const productList = order.products.map((p: OrderProduct) => `${p.productName} (${p.quantity} ${p.unit})`).join(', ');
        
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

      if (chatMessages.length > 0) {
        ChatMessage.insertMany(chatMessages)
          .then(async (insertedMessages) => {
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

              await emitNewMessage(order.sellerId, messageData);
              await emitNewMessage(userId, messageData);
            }
          })
          .catch(() => {});
      }

      if (buyer.email && insertedOrders.length > 0) {
        const firstOrder = insertedOrders[0];
        const buyerDoc = buyer as { fullName?: string; email: string };
      
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

        emailService.sendOrderConfirmation(buyer.email, {
          orderNumber: firstOrder.orderNumber,
          buyerName: buyerDoc.fullName || buyer.email.split('@')[0],
          products: firstOrder.products.map((p: OrderProduct) => ({
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
        }).catch(() => {});
      }

      const productIds = items.map((item: OrderItem) => item.productId);
      CartItem.deleteMany({
        userId,
        productId: { $in: productIds }
      }).catch(() => {});

      clearTimeout(timeoutId);
      return res.status(200).json({
        message: 'Order(s) placed successfully',
        orderId: createdOrders[0],
        orderIds: createdOrders
      });

    } catch (transactionError) {
      await session.abortTransaction();
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
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
