import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface UseNotificationSocketReturn {
  socket: Socket | null;
  connected: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export function useNotificationSocket(): UseNotificationSocketReturn {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Fetch unread count from API (HTTP polling fallback)
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/user/notifications/count', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const newCount = data.count || 0;
          
          // Only update if count changed
          if (newCount !== unreadCount) {
            setUnreadCount(newCount);
            
            // Emit count update event for other components
            window.dispatchEvent(new CustomEvent('notification-count-updated', {
              detail: { count: newCount }
            }));
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Initialize socket connection
    const initSocket = () => {
      try {
        // Use NEXT_PUBLIC_SOCKET_URL if provided, otherwise fallback to HTTP polling only
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
        
        if (!socketUrl) {
          return; // Skip socket initialization, rely on HTTP polling
        }

        // Connect to Socket.IO standalone service
        const socket = io(socketUrl, {
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          timeout: 10000,
          withCredentials: true,
          autoConnect: true
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          reconnectAttempts.current = 0;

          // Authenticate with token
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token=') || row.startsWith('hh_token='))
            ?.split('=')[1];

          if (token) {
            socket.emit('authenticate', token);
          }
        });

        socket.on('authenticated', (data: any) => {
          // Fetch initial count after authentication
          fetchUnreadCount();
        });

        socket.on('auth_error', (error: any) => {
          setConnected(false);
        });

        socket.on('disconnect', () => {
          setConnected(false);
        });

        socket.on('connect_error', (error) => {
          reconnectAttempts.current++;
          
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            socket.disconnect();
          }
        });

        // Real-time notification events
        socket.on('notifications:new', (notification: any) => {
          
          // Trigger shake animation via custom event
          window.dispatchEvent(new CustomEvent('notification-received', { 
            detail: notification 
          }));
          
          // Update unread count
          fetchUnreadCount();
        });

        socket.on('notifications:count', (data: { unread: number }) => {
          setUnreadCount(data.unread);
          
          // Emit count update event for other components
          window.dispatchEvent(new CustomEvent('notification-count-updated', {
            detail: { count: data.unread }
          }));
        });

        socketRef.current = socket;
      } catch (error) {
        // Silent fail
      }
    };

    // Initialize on mount
    initSocket();

    // Set up polling interval for mobile/fallback (every 10 seconds)
    // This ensures notifications work even if WebSocket fails on mobile
    const pollingInterval = setInterval(() => {
      // Only poll if not connected via socket OR if socket URL not configured
      if (!connected || !process.env.NEXT_PUBLIC_SOCKET_URL) {
        fetchUnreadCount();
      }
    }, 10000); // Poll every 10 seconds

    // Also fetch immediately
    fetchUnreadCount();

    // Refresh when page becomes visible (for mobile app switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    // Refresh when window gains focus (for desktop and mobile)
    const handleFocus = () => {
      fetchUnreadCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup on unmount
    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      if (socketRef.current) {
        console.log('Cleaning up Socket.IO connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  return {
    socket: socketRef.current,
    connected,
    unreadCount,
    setUnreadCount
  };
}
