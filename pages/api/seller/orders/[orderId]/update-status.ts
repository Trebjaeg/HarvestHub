import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';
import ChatMessage, { generateConversationId } from '../../../../../models/ChatMessage';
import jwt from 'jsonwebtoken';
import inventoryManager from '../../../../../lib/inventory-manager';
import mongoose from 'mongoose';
import { cache } from '../../../../../lib/memory-cache';
import { sendOrderConfirmationEmail } from '../../../../../lib/email-service-sendgrid';
import { sendOrderModificationEmail } from '../../../../../lib/email-service-sendgrid';
import { notifyOrderStatusUpdate } from '../../../../../lib/notification-utils';
import { emitNewMessage } from '../../../../../lib/socket-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let sellerId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; id?: string };
    sellerId = decoded.userId || decoded.id || '';
    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Invalid token structure' });
    }
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // Connect to database
  await dbConnect();    const { orderId } = req.query;
    const { status, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify seller owns this order
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this order' });
    }

    // Validate status transitions
    const currentStatus = order.status;
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['preparing', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['shipped', 'cancelled'],
      'shipped': ['cancelled'], // Seller cannot mark as delivered - only buyer can
      'delivered': ['completed'], // Seller can only complete after buyer confirms delivery
      'cancelled': [],
      'completed': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot transition from ${currentStatus} to ${status}. ${
          currentStatus === 'shipped' && status === 'delivered' 
            ? 'Only the buyer can confirm delivery by clicking "Order Received".' 
            : ''
        }` 
      });
    }

    // Prepare inventory items from order
    const inventoryItems = order.products.map((p: any) => ({
      productId: typeof p.productId === 'string' ? p.productId : p.productId.toString(),
      quantity: p.quantity
    }));

    // Start transaction for atomic status + inventory update
    const session = await mongoose.startSession();
    session.startTransaction();

    // Track deleted products and original amount across the transaction
    let deletedProductsInfo: any[] = [];
    let originalAmount = order.totalAmount;

    try {
      // Handle inventory transitions based on status change
      if (status === 'preparing' && currentStatus === 'pending') {
        // First, ensure products have inventory fields and check if inventory was reserved
        let needsReservation = false;
        const deletedProducts: any[] = [];
        const availableItems: typeof inventoryItems = [];
        
        for (const item of inventoryItems) {
          // Try to find product with proper ObjectId conversion
          let product;
          try {
            product = await Product.findById(item.productId).session(session);
          } catch (err) {
            // If ObjectId is invalid, mark as deleted
            const orderProduct = order.products.find((p: any) => 
              (typeof p.productId === 'string' ? p.productId : p.productId.toString()) === item.productId
            );
            deletedProducts.push(orderProduct);
            continue;
          }
          
          if (!product) {
            // Product was deleted - mark it
            const orderProduct = order.products.find((p: any) => 
              (typeof p.productId === 'string' ? p.productId : p.productId.toString()) === item.productId
            );
            deletedProducts.push(orderProduct);
            continue;
          }
          
          // Product exists - add to available items
          availableItems.push(item);
          
          // Migrate if needed
          if ((product.inventory_on_hand === undefined || product.inventory_on_hand === 0) && product.stock > 0) {
            await Product.findByIdAndUpdate(
              item.productId,
              {
                $set: {
                  inventory_on_hand: product.stock,
                  inventory_available: product.stock,
                  inventory_reserved: 0,
                  inventory_committed: 0
                }
              },
              { session }
            );
            needsReservation = true;
          } else if ((product.inventory_reserved ?? 0) === 0) {
            // Inventory not reserved for this order (old order before migration)
            needsReservation = true;
          }
        }
        
        // If ALL products are deleted, abort - cannot confirm empty order
        if (availableItems.length === 0) {
          await session.abortTransaction();
          session.endSession();
          
          return res.status(400).json({
            success: false,
            message: 'Cannot confirm order. All products have been deleted.',
            details: deletedProducts.map((p: any) => ({
              productName: p.productName,
              reason: 'Product no longer exists'
            }))
          });
        }
        
        // If SOME products are deleted, remove them from order and recalculate
        if (deletedProducts.length > 0) {
          // Remove deleted products from order
          const remainingProducts = order.products.filter((p: any) => {
            const prodId = typeof p.productId === 'string' ? p.productId : p.productId.toString();
            return availableItems.some((item: any) => item.productId === prodId);
          });
          
          // Recalculate order totals
          const newTotalAmount = remainingProducts.reduce((sum: number, p: any) => 
            sum + (p.price * p.quantity), 0
          );
          const deliveryFee = order.deliveryFee || 0;
          const newFinalAmount = newTotalAmount + deliveryFee;
          
          // Update order products and totals
          await Order.findByIdAndUpdate(
            orderId,
            {
              $set: {
                products: remainingProducts,
                totalAmount: newTotalAmount,
                finalAmount: newFinalAmount,
                notes: `${order.notes || ''}\n\nNote: ${deletedProducts.length} product(s) were removed as they are no longer available: ${deletedProducts.map((p: any) => p.productName).join(', ')}`
              }
            },
            { session }
          );
          
          // Update the order object for later use
          order.products = remainingProducts;
          order.totalAmount = newTotalAmount;
          order.finalAmount = newFinalAmount;
          
          // Store deleted products info for response
          deletedProductsInfo = deletedProducts.map((p: any) => ({
            productName: p.productName,
            quantity: p.quantity,
            price: p.price
          }));
        }
        
        // If inventory wasn't reserved, reserve it now from available stock
        if (needsReservation) {
          const reserveResult = await inventoryManager.reserveInventory(availableItems, session);
          if (!reserveResult.success) {
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
              success: false,
              message: 'Cannot confirm order. Insufficient stock available.',
              details: reserveResult.failedItems
            });
          }
        }
        
        // Now commit: reserved → committed (only for available items)
        const commitResult = await inventoryManager.commitInventory(availableItems, session);
        if (!commitResult.success) {
          await session.abortTransaction();
          session.endSession();
          
          // Get detailed product info for debugging
          const productDetails = await Promise.all(
            inventoryItems.map(async (item: any) => {
              const product = await Product.findById(item.productId).select('name inventory_reserved inventory_committed inventory_available').lean();
              return {
                productId: item.productId,
                requestedQty: item.quantity,
                product: product ? {
                  name: (product as any).name,
                  reserved: (product as any).inventory_reserved,
                  committed: (product as any).inventory_committed,
                  available: (product as any).inventory_available
                } : null
              };
            })
          );
          
          return res.status(400).json({
            success: false,
            message: 'Failed to commit inventory. Please check if products have sufficient reserved stock.',
            details: commitResult.failedItems,
            productDetails
          });
        }
      } else if (status === 'cancelled' && currentStatus === 'pending') {
        // Seller cancels before preparing: Try to release reserved inventory (if any)
        // Don't fail if products don't exist - order might be old or products deleted
        try {
          const releaseResult = await inventoryManager.releaseReservedInventory(inventoryItems, session);
          // Even if release fails, allow cancellation (products might be deleted)
        } catch (err) {
          // Ignore inventory release errors on cancellation
        }
      } else if (status === 'cancelled' && currentStatus === 'preparing') {
        // Seller cancels after preparing started: Try to release committed inventory
        try {
          const releaseResult = await inventoryManager.releaseCommittedInventory(inventoryItems, session);
          // Even if release fails, allow cancellation
        } catch (err) {
          // Ignore inventory release errors on cancellation
        }
      } else if (status === 'completed' && currentStatus === 'delivered') {
        // Order completed: committed → removed from on_hand
        const fulfillResult = await inventoryManager.fulfillOrder(inventoryItems, session);
        if (!fulfillResult.success) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Failed to fulfill order',
            details: fulfillResult.failedItems
          });
        }
      }

      // Update order
      const updateData: any = { status };

      // Add notes if provided
      if (notes) {
        updateData.notes = notes;
      }

      // Set actual delivery date when delivered
      if (status === 'delivered') {
        updateData.actualDelivery = new Date();
        // Mark payment as paid when order is delivered (especially for COD)
        updateData.paymentStatus = 'paid';
      }

      // Set estimated delivery when order starts preparing (7 days from now)
      if (status === 'preparing' && !order.estimatedDelivery) {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
        updateData.estimatedDelivery = estimatedDelivery;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, session }
      ).lean();

      // Commit transaction - both inventory and order status update succeed
      await session.commitTransaction();

      // Send notifications to buyer (asynchronous, don't block response)
      if (updatedOrder) {
        notifyOrderStatusUpdate(
          (updatedOrder as any).buyerId,
          (updatedOrder as any).orderNumber,
          (updatedOrder as any)._id.toString(),
          status,
          (updatedOrder as any).sellerName || 'Seller'
        ).catch(err => console.error('Error sending notification:', err));

        // Send automatic chat message to buyer about status update
        const conversationId = generateConversationId((updatedOrder as any).sellerId, (updatedOrder as any).buyerId);
        const statusMessages: { [key: string]: string } = {
          'preparing': `Your order ${(updatedOrder as any).orderNumber} is now being prepared! Estimated delivery: ${(updatedOrder as any).estimatedDelivery ? new Date((updatedOrder as any).estimatedDelivery).toLocaleDateString() : '7 days'}. We'll notify you once it's shipped!`,
          'shipped': `Great news! Your order ${(updatedOrder as any).orderNumber} has been shipped and is on its way to you!`,
          'delivered': `Your order ${(updatedOrder as any).orderNumber} has been delivered. Thank you for your purchase!`,
          'cancelled': `Your order ${(updatedOrder as any).orderNumber} has been cancelled${notes ? `. Reason: ${notes}` : '.'}`,
          'completed': `Order ${(updatedOrder as any).orderNumber} is complete. Thank you for shopping with us!`
        };

        if (statusMessages[status]) {
          ChatMessage.create({
          conversationId,
          senderId: (updatedOrder as any).sellerId,
          senderName: (updatedOrder as any).sellerName || 'Seller',
          senderRole: 'seller',
          receiverId: (updatedOrder as any).buyerId,
          receiverName: (updatedOrder as any).buyerName,
          receiverRole: 'buyer',
          message: statusMessages[status],
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .then(async (msg) => {
          // Emit real-time message to buyer
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

          // Emit to buyer
          await emitNewMessage((updatedOrder as any).buyerId, messageData);
          // Emit to seller (for their own chat view)
          await emitNewMessage((updatedOrder as any).sellerId, messageData);
        })
        .catch(err => console.error('Error creating status update chat message:', err));
        }
      }

      // Send order confirmation email to buyer when order starts preparing
      if (status === 'preparing' && updatedOrder) {
        try {
          const orderData = updatedOrder as any;
          // If products were deleted, send modification email instead
          if (deletedProductsInfo.length > 0) {
            await sendOrderModificationEmail(orderData.buyerEmail, {
              orderNumber: orderData.orderNumber,
              buyerName: orderData.buyerName,
              sellerName: orderData.sellerName || 'Seller',
              deletedProducts: deletedProductsInfo,
              remainingProducts: orderData.products.map((p: any) => ({
                productName: p.productName,
                quantity: p.quantity,
                price: p.price,
                unit: p.unit || 'pcs'
              })),
              originalAmount: originalAmount,
              newTotalAmount: orderData.totalAmount,
              deliveryFee: orderData.deliveryFee || 0,
              newFinalAmount: orderData.finalAmount,
              deliveryAddress: orderData.deliveryAddress,
              estimatedDelivery: orderData.estimatedDelivery
            });
          } else {
            // Normal confirmation email
            await sendOrderConfirmationEmail(orderData.buyerEmail, {
              orderNumber: orderData.orderNumber,
              buyerName: orderData.buyerName,
              sellerName: orderData.sellerName || 'Seller',
              products: orderData.products.map((p: any) => ({
                productName: p.productName,
                quantity: p.quantity,
                price: p.price,
                unit: p.unit || 'pcs'
              })),
              totalAmount: orderData.totalAmount,
              deliveryFee: orderData.deliveryFee || 0,
              finalAmount: orderData.finalAmount,
              deliveryAddress: orderData.deliveryAddress,
              estimatedDelivery: orderData.estimatedDelivery,
              paymentMethod: orderData.paymentMethod || 'Cash on Delivery'
            });
          }
        } catch (emailError) {
          // Don't fail the request if email fails - just continue
        }
      }

      // Clear all order-related caches for real-time updates
      if (updatedOrder) {
        const orderData = updatedOrder as any;
        const cachePatterns = [
          `orders:*`,
          `order:${orderId}`,
          `seller:orders:${sellerId}:*`,
          `buyer:orders:${orderData.buyerId}:*`,
          `products:*`, // Product inventory changed
          `product:*`
        ];
        
        for (const pattern of cachePatterns) {
          try {
            cache.delPattern(pattern);
          } catch (e) {
            // Silent fail - cache clear is not critical
          }
        }

        res.status(200).json({
          success: true,
          message: `Order status updated to ${status}`,
          order: {
            _id: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            status: orderData.status,
            estimatedDelivery: orderData.estimatedDelivery,
            actualDelivery: orderData.actualDelivery,
            notes: orderData.notes
          },
          ...(deletedProductsInfo.length > 0 && {
            warning: `${deletedProductsInfo.length} product(s) were removed from this order as they are no longer available.`,
            deletedProducts: deletedProductsInfo
          })
        });
      } else {
        return res.status(404).json({ success: false, message: 'Order not found after update' });
      }

    } catch (transactionError) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
      });
    } finally {
      session.endSession();
    }

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
