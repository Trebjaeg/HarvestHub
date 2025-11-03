/*
  Socket service (standalone)
  - Runs independently on PORT (default 4000)
  - Connects to MongoDB via native driver (uses same collection names as Mongoose models)
  - Verifies JWT on connection and joins user rooms: user:{userId} and order:{orderId}
  - Emits events: notifications:new, notifications:count, new_message, messages_read
  - Accepts events: authenticate, join_order, leave_order, send_message, typing, notifications:read

  Env expected (reuse existing names):
  - MONGODB_URI (required)
  - PORT (optional, default 4000)
  - JWT_SECRET (required for token verification)
  - ALLOWED_ORIGINS (CSV of allowed origins for CORS)

*/

const http = require('http');
const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load .env.local from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT, 10) : 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_PUBLIC_KEY || process.env.NEXT_PUBLIC_JWT_SECRET;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required for socket-service');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required for socket-service to validate auth tokens');
  process.exit(1);
}

let dbClient;
let db;

async function connectDb() {
  if (db) return db;
  dbClient = new MongoClient(MONGODB_URI);
  await dbClient.connect();
  db = dbClient.db();
  console.log('Socket service connected to MongoDB');
  return db;
}

async function start() {
  await connectDb();

  const httpServer = http.createServer((req, res) => {
    // Simple HTTP endpoint for server-side socket emits
    if (req.method === 'POST' && req.url === '/emit') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { room, event, data } = JSON.parse(body);
          if (room && event && data) {
            io.to(room).emit(event, data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing room, event, or data' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow undefined origin (native clients/tools)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        // Fallback: allow localhost on any port for development
        if (origin && origin.startsWith('http://localhost:')) return callback(null, true);
        callback(new Error('Origin not allowed'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    allowEIO3: true,
    pingInterval: 25000,
    pingTimeout: 60000,
    connectTimeout: 45000,
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    socket.on('authenticate', async (token) => {
      if (!token) {
        socket.emit('auth_error', { message: 'No token provided' });
        return socket.disconnect();
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.id || decoded.sub;
        const userRole = decoded.role || decoded.userRole || 'buyer';

        socket.data.userId = userId;
        socket.data.userRole = userRole;

        // join personal room
        socket.join(`user:${userId}`);

        // Join all conversation rooms for this user
        const chatColl = db.collection('chatmessages');
        const conversations = await chatColl.distinct('conversationId', {
          $or: [
            { senderId: String(userId) },
            { receiverId: String(userId) }
          ]
        });

        conversations.forEach(convId => {
          if (convId) socket.join(`conversation:${convId}`);
        });

        socket.emit('authenticated', { userId });

        // Emit current unread notification count for user
        const notificationsColl = db.collection('notifications');
        const unreadNotifications = await notificationsColl.countDocuments({ userId: String(userId), isRead: false });
        socket.emit('notifications:count', { unread: unreadNotifications });

        // Emit current unread chat message count for user
        const unreadMessages = await chatColl.countDocuments({ receiverId: String(userId), isRead: false });
        socket.emit('unread_count:update', { totalUnread: unreadMessages });

      } catch (err) {
        socket.emit('auth_error', { message: 'Invalid token' });
        socket.disconnect();
      }
    });

    // Join specific conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId || !socket.data.userId) return;

      // ACL: Verify user is participant in this conversation
      const [userId1, userId2] = conversationId.split('_').sort();
      if (socket.data.userId !== userId1 && socket.data.userId !== userId2) {
        socket.emit('error', { message: 'Unauthorized access to conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit('conversation_joined', { conversationId });
    });

    // Join support conversation room (NEW)
    socket.on('join_support', async ({ supportConversationId }) => {
      if (!supportConversationId || !socket.data.userId) return;

      try {
        // Verify user has access to this support conversation
        const supportColl = db.collection('supportconversations');
        const conversation = await supportColl.findOne({ 
          _id: new ObjectId(supportConversationId) 
        });

        if (!conversation) {
          socket.emit('error', { message: 'Support conversation not found' });
          return;
        }

        // Allow access if user is the conversation owner or is an admin
        const isOwner = conversation.userId === String(socket.data.userId);
        const isAdmin = socket.data.userRole === 'admin';

        if (!isOwner && !isAdmin) {
          socket.emit('error', { message: 'Unauthorized access to support conversation' });
          return;
        }

        socket.join(`support:${supportConversationId}`);
        socket.emit('support_joined', { supportConversationId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join support conversation' });
      }
    });

    // Leave support conversation room (NEW)
    socket.on('leave_support', ({ supportConversationId }) => {
      if (supportConversationId) {
        socket.leave(`support:${supportConversationId}`);
      }
    });

    // Handle support messages (NEW)
    socket.on('support_message', async (data) => {
      try {
        if (!socket.data.userId) {
          return socket.emit('message_error', { message: 'Not authenticated' });
        }

        const { supportConversationId, message } = data;
        
        if (!supportConversationId) {
          return socket.emit('message_error', { message: 'Missing supportConversationId' });
        }

        // Verify user has access to this support conversation
        const supportColl = db.collection('supportconversations');
        const conversation = await supportColl.findOne({ 
          _id: new ObjectId(supportConversationId) 
        });

        if (!conversation) {
          return socket.emit('message_error', { message: 'Support conversation not found' });
        }

        const isOwner = conversation.userId === String(socket.data.userId);
        const isAdmin = socket.data.userRole === 'admin';

        if (!isOwner && !isAdmin) {
          return socket.emit('message_error', { message: 'Unauthorized' });
        }

        // Broadcast the message object to all clients in the support room
        // The message was already saved to DB by the API route
        const messageToEmit = data.message || message;
        
        // Emit to support room (includes both user and admin)
        io.to(`support:${supportConversationId}`).emit('new_message', messageToEmit);

        // Also emit to user's personal room if they're not in the support room
        if (conversation.userId) {
          io.to(`user:${conversation.userId}`).emit('new_message', messageToEmit);
        }

        // Emit to all admins
        const usersColl = db.collection('users');
        const admins = await usersColl.find({ role: 'admin' }).toArray();
        admins.forEach(admin => {
          io.to(`user:${admin._id.toString()}`).emit('new_message', messageToEmit);
        });

        // Confirm to sender
        socket.emit('message_sent', messageToEmit);
      } catch (err) {
        console.error('Error handling support_message:', err);
        socket.emit('message_error', { message: 'Failed to send support message' });
      }
    });

    socket.on('join_order', async (orderId) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);

      // mark messages as read for this user in that order
      try {
        if (socket.data.userId) {
          const chatColl = db.collection('chatmessages');
          await chatColl.updateMany(
            { orderId: orderId, receiverId: String(socket.data.userId), isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
          );

          socket.to(`order:${orderId}`).emit('messages_read', { orderId, userId: socket.data.userId });
        }
      } catch (err) {
        // Silent fail
      }
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Message acknowledgment (client confirms receipt)
    socket.on('message:ack', async ({ messageId }) => {
      try {
        if (!socket.data.userId || !messageId) return;

        const chatColl = db.collection('chatmessages');
        const message = await chatColl.findOne({ _id: new ObjectId(messageId) });

        if (message && message.senderId) {
          // Emit delivery status to sender
          io.to(`user:${message.senderId}`).emit('message:delivered', {
            messageId,
            deliveredAt: new Date(),
            deliveredTo: socket.data.userId
          });
        }
      } catch (err) {
        // Silent fail
      }
    });

    // Mark messages as read (batched)
    socket.on('message:read', async ({ conversationId, messageIds }) => {
      try {
        if (!socket.data.userId || !conversationId || !messageIds || !Array.isArray(messageIds)) return;

        // ACL: Verify user is participant in conversation
        const [userId1, userId2] = conversationId.split('_').sort();
        if (socket.data.userId !== userId1 && socket.data.userId !== userId2) {
          return;
        }

        const chatColl = db.collection('chatmessages');
        const readAt = new Date();

        // Update database
        const updateResult = await chatColl.updateMany(
          {
            _id: { $in: messageIds.map(id => {
              try { return new ObjectId(id); } catch { return id; }
            })},
            conversationId,
            receiverId: String(socket.data.userId),
            isRead: false
          },
          {
            $set: { isRead: true, readAt }
          }
        );

        if (updateResult.modifiedCount > 0) {
          // Determine sender (the other participant)
          const senderId = socket.data.userId === userId1 ? userId2 : userId1;

          // Emit read receipt to sender
          io.to(`user:${senderId}`).emit('message:read_receipt', {
            conversationId,
            messageIds,
            readBy: socket.data.userId,
            readAt
          });

          // Update receiver's unread count
          const unreadCount = await chatColl.countDocuments({
            receiverId: String(socket.data.userId),
            isRead: false
          });

          socket.emit('unread_count:update', { 
            totalUnread: unreadCount, 
            conversationId 
          });
        }
      } catch (err) {
        // Silent fail
      }
    });

    socket.on('send_message', async (data) => {
      try {
        if (!socket.data.userId) return socket.emit('message_error', { message: 'Not authenticated' });

        const chatColl = db.collection('chatmessages');
        const messageDoc = {
          orderId: data.orderId || null,
          orderNumber: data.orderNumber || null,
          conversationId: data.conversationId || null,
          senderId: String(socket.data.userId),
          senderName: data.senderName || 'User',
          senderRole: socket.data.userRole || 'buyer',
          receiverId: String(data.receiverId),
          receiverName: data.receiverName || null,
          receiverRole: data.receiverRole || 'buyer',
          message: data.content || data.message || '',
          messageType: data.messageType || 'text',
          fileName: data.fileName || null,
          fileSize: data.fileSize || null,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const insertResult = await chatColl.insertOne(messageDoc);
        const inserted = Object.assign({ _id: insertResult.insertedId.toString() }, messageDoc);

        // Emit to relevant room(s): order room and receiver user room
        if (data.orderId) {
          io.to(`order:${data.orderId}`).emit('new_message', inserted);
        }

        if (data.receiverId) {
          io.to(`user:${String(data.receiverId)}`).emit('new_message', inserted);
        }

        // Update receiver's unread count
        if (data.receiverId) {
          const unreadCount = await chatColl.countDocuments({
            receiverId: String(data.receiverId),
            isRead: false
          });
          io.to(`user:${String(data.receiverId)}`).emit('unread_count:update', {
            totalUnread: unreadCount,
            conversationId: data.conversationId
          });
        }

        // Confirm to sender
        socket.emit('message_sent', inserted);
      } catch (err) {
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (payload) => {
      // Support both order-based typing (for order chat) and direct user typing (for inbox)
      if (payload.orderId) {
        socket.to(`order:${payload.orderId}`).emit('user_typing', { userId: socket.data.userId, orderId: payload.orderId, isTyping: !!payload.isTyping });
      } else if (payload.receiverId) {
        // Direct message typing indicator - emit to receiver
        io.to(`user:${String(payload.receiverId)}`).emit('typing', { userId: socket.data.userId, isTyping: !!payload.isTyping });
      }
    });

    socket.on('notifications:read', async (data) => {
      try {
        if (!socket.data.userId || !data?.ids || !Array.isArray(data.ids)) return;
        const idsToUpdate = data.ids.slice(0, 50).map(id => {
          try { return new ObjectId(id); } catch { return id; }
        });

        const notificationsColl = db.collection('notifications');
        await notificationsColl.updateMany(
          { _id: { $in: idsToUpdate }, userId: String(socket.data.userId) },
          { $set: { isRead: true, readAt: new Date() } }
        );

        const unread = await notificationsColl.countDocuments({ userId: String(socket.data.userId), isRead: false });
        socket.emit('notifications:count', { unread });
      } catch (err) {
        // Silent fail
      }
    });

    socket.on('disconnect', () => {
      // Connection closed
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Socket service listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Socket service failed to start', err);
  process.exit(1);
});
