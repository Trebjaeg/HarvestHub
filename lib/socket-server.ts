import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import ChatMessage from '@/models/ChatMessage';
import Notification from '@/models/Notification';
import dbConnect from './mongodb';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (token: string) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId || decoded.id;
        
        socket.data.userId = userId;
        socket.data.userRole = decoded.role;
        
        // Join user's personal notification room
        socket.join(`user:${userId}`);
        
        socket.emit('authenticated', { userId });
        console.log('User authenticated:', userId, 'joined room user:' + userId);
      } catch (error) {
        socket.emit('auth_error', { message: 'Invalid token' });
        socket.disconnect();
      }
    });

    // Join order chat room
    socket.on('join_order', async (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${socket.data.userId} joined order ${orderId}`);
      
      // Mark messages as read when joining
      if (socket.data.userId) {
        await dbConnect();
        await ChatMessage.updateMany(
          {
            orderId,
            receiverId: socket.data.userId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );
        
        // Notify other users in the room
        socket.to(`order:${orderId}`).emit('messages_read', {
          orderId,
          userId: socket.data.userId,
        });
      }
    });

    // Leave order chat room
    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`User ${socket.data.userId} left order ${orderId}`);
    });

    // Send message
    socket.on('send_message', async (data: {
      orderId: string;
      orderNumber: string;
      receiverId: string;
      receiverName: string;
      messageType: 'text' | 'image' | 'file';
      content: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      try {
        await dbConnect();
        
        const message = await ChatMessage.create({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          senderId: socket.data.userId,
          senderName: socket.data.userName || 'User',
          senderRole: socket.data.userRole || 'buyer',
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          messageType: data.messageType,
          content: data.content,
          fileName: data.fileName,
          fileSize: data.fileSize,
          isSystemMessage: false,
          isDelivered: true,
          deliveredAt: new Date(),
          isRead: false,
        });

        // Emit to room
        io?.to(`order:${data.orderId}`).emit('new_message', {
          _id: message._id.toString(),
          orderId: message.orderId,
          orderNumber: message.orderNumber,
          senderId: message.senderId,
          senderName: message.senderName,
          senderRole: message.senderRole,
          receiverId: message.receiverId,
          receiverName: message.receiverName,
          messageType: message.messageType,
          content: message.content,
          fileName: message.fileName,
          fileSize: message.fileSize,
          isSystemMessage: message.isSystemMessage,
          isRead: message.isRead,
          isDelivered: message.isDelivered,
          createdAt: message.createdAt,
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { orderId: string; isTyping: boolean }) => {
      socket.to(`order:${data.orderId}`).emit('user_typing', {
        userId: socket.data.userId,
        orderId: data.orderId,
        isTyping: data.isTyping,
      });
    });

    // Mark notifications as read
    socket.on('notifications:read', async (data: { ids: string[] }) => {
      if (!socket.data.userId || !data.ids || !Array.isArray(data.ids)) {
        return;
      }

      try {
        await dbConnect();
        
        // Batch update - limit to 50 IDs per request
        const idsToUpdate = data.ids.slice(0, 50);
        
        await Notification.updateMany(
          {
            _id: { $in: idsToUpdate },
            userId: socket.data.userId // Security: only mark user's own notifications
          },
          {
            $set: {
              isRead: true,
              readAt: new Date()
            }
          }
        );

        // Emit updated count
        const unreadCount = await Notification.countDocuments({
          userId: socket.data.userId,
          isRead: false
        });

        socket.emit('notifications:count', { unread: unreadCount });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
