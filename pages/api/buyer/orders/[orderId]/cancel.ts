import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import jwt from 'jsonwebtoken';
import inventoryManager from '../../../../../lib/inventory-manager';
import mongoose from 'mongoose';
import { createNotification } from '../../../../../lib/notification-utils';
import ChatMessage, { generateConversationId } from '../../../../../models/ChatMessage';
import { emitNewMessage } from '../../../../../lib/socket-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderId } = req.query;

  try {
    // Extract and verify JWT token from multiple sources
    const token = 
      req.cookies.token || 
      req.cookies['auth-token'] || 
      req.cookies['hh_token'] ||
      req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      buyerId: buyerId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled' || order.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: `Order is already ${order.status}`,
        locked: true
      });
    }

    // Check if there's already a pending cancellation request
    if (order.cancellationRequest && order.cancellationRequest.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'A cancellation request is already pending for this order',
        locked: true
      });
    }

    // Get cancellation reason from request body
    const { reason, reasonCategory } = req.body || {};

    // For pending orders, allow direct cancellation
    if (order.status === 'pending') {
      // Prepare inventory items from order
      const inventoryItems = order.products.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity
      }));

      // Start transaction for atomic cancel + inventory release
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Release reserved inventory back to available
        const releaseResult = await inventoryManager.releaseReservedInventory(inventoryItems, session);
        
        if (!releaseResult.success) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Failed to release inventory',
            details: releaseResult.failedItems
          });
        }

        // Update order status to cancelled
        const updatedOrderResult = await Order.findByIdAndUpdate(
          orderId,
          { 
            status: 'cancelled',
            paymentStatus: 'refunded',
            notes: reason ? `Cancelled by buyer: ${reason}` : 'Cancelled by buyer'
          },
          { new: true, session }
        ).lean();

        if (!updatedOrderResult) {
          await session.abortTransaction();
          return res.status(500).json({
            success: false,
            message: 'Failed to update order status'
          });
        }

        const orderData: any = updatedOrderResult;

        // Commit transaction
        await session.commitTransaction();

        // Send notifications about cancellation (asynchronous)
        if (orderData) {
          // Create notification for buyer (confirmation)
          createNotification({
            userId: buyerId,
            userRole: 'buyer',
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Your order ${orderData.orderNumber} has been cancelled successfully`,
            orderId: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            metadata: {
              cancelledBy: 'buyer',
              actionUrl: `/orders/${orderData._id.toString()}`
            }
          }).catch(err => console.error('Error sending buyer notification:', err));

          // Create notification for seller
          createNotification({
            userId: orderData.sellerId,
            userRole: 'seller',
            type: 'order_cancelled',
            title: 'Order Cancelled by Buyer',
            message: `${orderData.buyerName || 'Buyer'} cancelled order ${orderData.orderNumber}`,
            orderId: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            relatedUserId: buyerId,
            relatedUserName: orderData.buyerName || 'Buyer',
            metadata: {
              cancelledBy: 'buyer',
              actionUrl: `/seller/orders/${orderData._id.toString()}`
            }
          }).catch(err => console.error('Error sending seller notification:', err));

          // Send automatic chat message to seller about cancellation
          const conversationId = generateConversationId(orderData.sellerId, buyerId);
          ChatMessage.create({
            conversationId,
            senderId: buyerId,
            senderName: orderData.buyerName || 'Buyer',
            senderRole: 'buyer',
            receiverId: orderData.sellerId,
            receiverName: orderData.sellerName || 'Seller',
            receiverRole: 'seller',
            message: `I have cancelled order ${orderData.orderNumber}. The reserved inventory has been released back to your stock.`,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .then(async (msg) => {
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

            // Emit to seller
            await emitNewMessage(orderData.sellerId, messageData);
            // Emit to buyer (for their own chat view)
            await emitNewMessage(buyerId, messageData);
          })
          .catch(err => console.error('Error creating cancellation chat message:', err));
        }

        return res.status(200).json({
          success: true,
          message: 'Order cancelled successfully. Inventory has been released.',
          order: {
            _id: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            status: orderData.status
          }
        });

      } catch (transactionError) {
        await session.abortTransaction();
        console.error('Transaction error:', transactionError);
        return res.status(500).json({
          success: false,
          message: 'Failed to cancel order',
          error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
        });
      } finally {
        session.endSession();
      }
    }

    // Order has been confirmed by seller - create cancellation request
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        cancellationRequest: {
          requestedBy: 'buyer',
          reason: reason || 'Buyer requested cancellation',
          reasonCategory: reasonCategory || 'other',
          requestedAt: new Date(),
          status: 'pending'
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create cancellation request'
      });
    }

    // Notify seller about cancellation request
    createNotification({
      userId: order.sellerId,
      userRole: 'seller',
      type: 'order_cancelled',
      title: 'Cancellation Request',
      message: `${order.buyerName || 'Buyer'} requested to cancel order ${order.orderNumber}`,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      relatedUserId: buyerId,
      relatedUserName: order.buyerName || 'Buyer',
      metadata: {
        reason: reason || 'Buyer requested cancellation',
        actionUrl: `/seller/orders`
      }
    }).catch(err => console.error('Error sending seller notification:', err));

    // Emit real-time order update via Socket.IO to seller
    try {
      const { emitToRoom } = await import('../../../../../lib/socket-client');
      await emitToRoom(`user:${order.sellerId}`, 'order:cancellation_requested', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        reason: reason || 'Buyer requested cancellation',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting cancellation request via Socket.IO:', error);
    }

    // Send chat message to seller
    const conversationId = generateConversationId(order.sellerId, buyerId);
    ChatMessage.create({
      conversationId,
      senderId: buyerId,
      senderName: order.buyerName || 'Buyer',
      senderRole: 'buyer',
      receiverId: order.sellerId,
      receiverName: order.sellerName || 'Seller',
      receiverRole: 'seller',
      message: `I would like to cancel order ${order.orderNumber}. Reason: ${reason || 'No reason provided'}. Please review my cancellation request.`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .then(async (msg) => {
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
      await emitNewMessage(buyerId, messageData);
    })
    .catch(err => console.error('Error creating cancellation request chat message:', err));

    return res.status(200).json({
      success: true,
      message: 'Cancellation request submitted. Waiting for seller approval.',
      requiresApproval: true,
      order: {
        _id: updatedOrder._id.toString(),
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        cancellationRequest: updatedOrder.cancellationRequest
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}