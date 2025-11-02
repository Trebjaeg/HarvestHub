// CommonJS version for custom server
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocketIO(httpServer) {
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
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    socket.on('join_order', async (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${socket.data.userId} joined order ${orderId}`);
    });

    // Leave order chat room
    socket.on('leave_order', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`User ${socket.data.userId} left order ${orderId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      const { orderId, message } = data;
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      try {
        // Import models dynamically
        const ChatMessage = require('./models/ChatMessage').default;
        const User = require('./models/User').default;
        await require('./lib/mongodb').default();

        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const newMessage = await ChatMessage.create({
          orderId,
          senderId: userId,
          senderName: user.username || user.email,
          message,
        });

        // Broadcast to order room
        io.to(`order:${orderId}`).emit('new_message', {
          _id: newMessage._id.toString(),
          orderId,
          senderId: userId,
          senderName: user.username || user.email,
          message,
          createdAt: newMessage.createdAt,
        });

        console.log(`Message sent in order ${orderId} by ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      const { orderId } = data;
      const userId = socket.data.userId;

      if (!userId) return;

      try {
        const ChatMessage = require('./models/ChatMessage').default;
        await require('./lib/mongodb').default();

        await ChatMessage.updateMany(
          {
            orderId,
            senderId: { $ne: userId },
            isRead: false,
          },
          { isRead: true }
        );

        io.to(`order:${orderId}`).emit('messages_read', { orderId, userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Mark notifications as read
    socket.on('notifications:read', async (notificationIds) => {
      const userId = socket.data.userId;

      if (!userId || !Array.isArray(notificationIds)) {
        return;
      }

      try {
        const Notification = require('./models/Notification').default;
        await require('./lib/mongodb').default();

        await Notification.updateMany(
          {
            _id: { $in: notificationIds },
            userId,
            isRead: false,
          },
          { isRead: true }
        );

        console.log(`Marked ${notificationIds.length} notifications as read for user ${userId}`);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocketIO, getIO };
