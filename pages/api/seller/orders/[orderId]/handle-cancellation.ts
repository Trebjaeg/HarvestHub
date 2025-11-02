import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import jwt from 'jsonwebtoken';
import inventoryManager from '../../../../../lib/inventory-manager';
import mongoose from 'mongoose';
import { createNotification } from '../../../../../lib/notification-utils';
import ChatMessage, { generateConversationId } from '../../../../../models/ChatMessage';
import { emitNewMessage } from '../../../../../lib/socket-client';

/**
 * POST /api/seller/orders/[orderId]/handle-cancellation
 * Seller approves or rejects buyer's cancellation request
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderId } = req.query;
  const { action } = req.body; // 'approve' or 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
  }

  try {
    // Extract and verify JWT token
    const token = 
      req.cookies.token || 
      req.cookies['auth-token'] || 
      req.cookies['hh_token'] ||
      req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const sellerId = decoded.userId || decoded.id;

    if (!sellerId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      sellerId: sellerId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if there's a pending cancellation request
    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending cancellation request found for this order'
      });
    }

    if (action === 'approve') {
      // Approve cancellation - cancel the order
      const inventoryItems = order.products.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity
      }));

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Release inventory
        const releaseResult = await inventoryManager.releaseReservedInventory(inventoryItems, session);
        
        if (!releaseResult.success) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Failed to release inventory',
            details: releaseResult.failedItems
          });
        }

        // Update order and refund payment
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { 
            status: 'cancelled',
            paymentStatus: 'refunded',
            'cancellationRequest.status': 'approved',
            notes: order.cancellationRequest.reason 
              ? `Cancelled by buyer (approved by seller): ${order.cancellationRequest.reason}` 
              : 'Cancelled by buyer (approved by seller)'
          },
          { new: true, session }
        );

        if (!updatedOrder) {
          await session.abortTransaction();
          return res.status(500).json({
            success: false,
            message: 'Failed to update order'
          });
        }

        await session.commitTransaction();

        // Notify buyer
        createNotification({
          userId: order.buyerId,
          userRole: 'buyer',
          type: 'cancellation_approved',
          title: 'Cancellation Approved',
          message: `Your cancellation request for order ${order.orderNumber} has been approved`,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          metadata: {
            actionUrl: `/buyer-orders/${order._id.toString()}`
          }
        }).catch(err => console.error('Error sending notification:', err));

        // Send chat message
        const conversationId = generateConversationId(sellerId, order.buyerId);
        ChatMessage.create({
          conversationId,
          senderId: sellerId,
          senderName: order.sellerName || 'Seller',
          senderRole: 'seller',
          receiverId: order.buyerId,
          receiverName: order.buyerName || 'Buyer',
          receiverRole: 'buyer',
          message: `I have approved your cancellation request for order ${order.orderNumber}. The order has been cancelled and inventory has been released.`,
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
          await emitNewMessage(order.buyerId, messageData);
          await emitNewMessage(sellerId, messageData);
        })
        .catch(err => console.error('Error creating chat message:', err));

        session.endSession();

        // Emit real-time order update via Socket.IO to buyer
        try {
          const { emitToRoom } = await import('../../../../../lib/socket-client');
          await emitToRoom(`user:${order.buyerId}`, 'order:cancellation_approved', {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            sellerName: order.sellerName,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error emitting cancellation approval via Socket.IO:', error);
        }

        return res.status(200).json({
          success: true,
          message: 'Cancellation approved. Order has been cancelled.',
          order: {
            _id: updatedOrder._id.toString(),
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status
          }
        });

      } catch (transactionError) {
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction error:', transactionError);
        return res.status(500).json({
          success: false,
          message: 'Failed to approve cancellation',
          error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
        });
      }

    } else {
      // Reject cancellation
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { 
          'cancellationRequest.status': 'rejected'
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update order'
        });
      }

      // Notify buyer
      createNotification({
        userId: order.buyerId,
        userRole: 'buyer',
        type: 'cancellation_rejected',
        title: 'Cancellation Rejected',
        message: `Your cancellation request for order ${order.orderNumber} has been rejected by the seller`,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        metadata: {
          actionUrl: `/buyer-orders/${order._id.toString()}`
        }
      }).catch(err => console.error('Error sending notification:', err));

      // Send chat message
      const conversationId = generateConversationId(sellerId, order.buyerId);
      ChatMessage.create({
        conversationId,
        senderId: sellerId,
        senderName: order.sellerName || 'Seller',
        senderRole: 'seller',
        receiverId: order.buyerId,
        receiverName: order.buyerName || 'Buyer',
        receiverRole: 'buyer',
        message: `I have rejected your cancellation request for order ${order.orderNumber}. The order will continue as planned.`,
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
        await emitNewMessage(order.buyerId, messageData);
        await emitNewMessage(sellerId, messageData);
      })
      .catch(err => console.error('Error creating chat message:', err));

      // Emit real-time order update via Socket.IO to buyer
      try {
        const { emitToRoom } = await import('../../../../../lib/socket-client');
        await emitToRoom(`user:${order.buyerId}`, 'order:cancellation_rejected', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          sellerName: order.sellerName,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error emitting cancellation rejection via Socket.IO:', error);
      }

      return res.status(200).json({
        success: true,
        message: 'Cancellation request rejected.',
        order: {
          _id: updatedOrder._id.toString(),
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          cancellationRequest: updatedOrder.cancellationRequest
        }
      });
    }

  } catch (error) {
    console.error('Error handling cancellation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
