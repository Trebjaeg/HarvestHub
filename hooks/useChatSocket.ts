import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

interface UseChatSocketProps {
  userId: string | undefined;
  onNewMessage?: (message: Message) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onUnreadUpdate?: (data: { totalUnread: number; conversationId?: string }) => void;
  onReadReceipt?: (data: { conversationId: string; messageIds: string[]; readAt: Date }) => void;
}

export function useChatSocket({ userId, onNewMessage, onTyping, onUnreadUpdate, onReadReceipt }: UseChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Store callbacks in refs to avoid reconnecting socket when they change
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onUnreadUpdateRef = useRef(onUnreadUpdate);
  const onReadReceiptRef = useRef(onReadReceipt);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onTypingRef.current = onTyping;
    onUnreadUpdateRef.current = onUnreadUpdate;
    onReadReceiptRef.current = onReadReceipt;
  }, [onNewMessage, onTyping, onUnreadUpdate, onReadReceipt]);

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.IO server ONCE
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Try websocket first for better performance
      reconnection: true,
      reconnectionAttempts: 10, // Increased attempts
      reconnectionDelay: 1000, // Start with 1 second
      reconnectionDelayMax: 10000, // Max 10 seconds
      timeout: 30000, // Increased to 30 seconds to prevent timeouts
      autoConnect: true,
      forceNew: false,
      upgrade: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      
      // Authenticate with JWT token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('authenticated', () => {
      setIsConnected(true);
    });

    // Listen for new messages - use ref to get latest callback
    socket.on('new_message', (message: Message) => {
      onNewMessageRef.current?.(message);
      
      // Send acknowledgment
      if (message._id) {
        socket.emit('message:ack', { messageId: message._id });
      }
    });

    // Listen for typing indicators - use ref to get latest callback
    socket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      onTypingRef.current?.(data);
    });

    // Listen for unread count updates
    socket.on('unread_count:update', (data: { totalUnread: number; conversationId?: string }) => {
      onUnreadUpdateRef.current?.(data);
    });

    // Listen for read receipts
    socket.on('message:read_receipt', (data: { conversationId: string; messageIds: string[]; readAt: Date }) => {
      onReadReceiptRef.current?.(data);
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      // Retry connection after delay
      setTimeout(() => {
        if (socket.disconnected) {
          socket.connect();
        }
      }, 3000);
    });

    socket.on('connect_timeout', () => {
      setIsConnected(false);
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      // Re-authenticate on reconnect
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [userId]); // Only reconnect if userId changes

  const sendTypingIndicator = (receiverId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { receiverId, isTyping });
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  };

  const markAsRead = (conversationId: string, messageIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:read', { conversationId, messageIds });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendTypingIndicator,
    joinConversation,
    markAsRead,
  };
}
