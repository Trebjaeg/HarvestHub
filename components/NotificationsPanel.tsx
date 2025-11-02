import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  readAt?: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

type NotificationTab = 'all' | 'orders' | 'messages' | 'system';

export default function NotificationsPanel({ isOpen, onClose, onUnreadCountChange, buttonRef }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const { socket } = useNotificationSocket();

  // Fetch notifications (with optional silent mode for background refresh)
  const fetchNotifications = async (pageNum: number = 1, silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/user/notifications?page=${pageNum}&limit=20`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Mark visible notifications as read
  const markVisibleAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.isRead)
      .map(n => n.id)
      .slice(0, 20); // Batch limit

    if (unreadIds.length === 0) return;

    try {
      const response = await fetch('/api/user/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: unreadIds })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            unreadIds.includes(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );

        // Emit via socket if available
        if (socket) {
          socket.emit('notifications:read', { ids: unreadIds });
        }

        // Update parent component
        if (onUnreadCountChange && data.unreadCount !== undefined) {
          onUnreadCountChange(data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen]);

  // Auto-refresh notifications when panel is open (for mobile real-time updates)
  useEffect(() => {
    if (!isOpen) return;

    // Refresh every 5 seconds when panel is open (silent mode - no loading spinner)
    const refreshInterval = setInterval(() => {
      fetchNotifications(1, true);
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [isOpen]);

  // Refresh notifications when page becomes visible (for mobile app switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isOpen) {
        fetchNotifications(1, true); // Silent refresh
      }
    };

    // Refresh when window gains focus (for desktop and mobile)
    const handleFocus = () => {
      if (isOpen) {
        fetchNotifications(1, true); // Silent refresh
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen]);

  // Mark as read when panel opens
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // Delay marking as read to give user time to see notifications
      const timer = setTimeout(() => {
        markVisibleAsRead();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications]);

  // Close on outside click only (not on scroll)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Listen for new notifications via socket
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail;
      
      // Add to top of list if panel is open
      if (isOpen) {
        setNotifications(prev => [{
          id: newNotification.id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          orderId: newNotification.orderId,
          orderNumber: newNotification.orderNumber,
          isRead: false,
          metadata: newNotification.metadata,
          createdAt: newNotification.createdAt
        }, ...prev]);
      }
    };

    window.addEventListener('notification-received', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification-received', handleNewNotification as EventListener);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_confirmed':
        return '🛒';
      case 'order_shipped':
        return '🚚';
      case 'order_delivered':
        return '✅';
      case 'order_cancelled':
        return '❌';
      case 'order_completed':
        return '🎉';
      case 'message':
        return '💬';
      case 'review':
      case 'review_response':
        return '⭐';
      case 'system':
      case 'promotion':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationCategory = (type: string): NotificationTab => {
    if (type.startsWith('order_')) return 'orders';
    if (type === 'message' || type === 'chat') return 'messages';
    if (type === 'system' || type === 'account' || type === 'security') return 'system';
    return 'all';
  };

  const filterNotificationsByTab = (notifs: Notification[]): Notification[] => {
    if (activeTab === 'all') return notifs;
    return notifs.filter(n => getNotificationCategory(n.type) === activeTab);
  };

  const filteredNotifications = filterNotificationsByTab(notifications);

  const getTabCount = (tab: NotificationTab): number => {
    if (tab === 'all') return notifications.filter(n => !n.isRead).length;
    return notifications.filter(n => !n.isRead && getNotificationCategory(n.type) === tab).length;
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.orderId) {
      return `/orders/${notification.orderId}`;
    }
    if (notification.metadata?.actionUrl) {
      return notification.metadata.actionUrl;
    }
    // Fallback for message notifications without actionUrl
    if (notification.type === 'message') {
      // Try to get sender ID from metadata or relatedUserId
      const senderId = notification.metadata?.senderId || notification.metadata?.relatedUserId;
      if (senderId) {
        return `/inbox?userId=${senderId}`;
      }
      return '/inbox'; // Default to inbox homepage
    }
    return '#';
  };

  if (!isOpen || !buttonRef.current) return null;

  const buttonRect = buttonRef.current.getBoundingClientRect();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Panel width based on device
  const panelWidth = isMobile ? Math.min(screenWidth - 16, 360) : 384;
  
  // Position below the notification bell with smaller gap on mobile
  const topPosition = buttonRect.bottom + (isMobile ? 8 : 8);
  
  // For mobile: align right edge of panel with right edge of screen (with safe padding)
  // For desktop: align right edge of panel with right edge of button
  let leftPosition;
  
  if (isMobile) {
    // On mobile, position from right edge with safe padding
    // Ensure panel stays within viewport
    const rightPadding = 8;
    leftPosition = Math.max(8, screenWidth - panelWidth - rightPadding);
  } else {
    // On desktop, align with button
    leftPosition = buttonRect.right - panelWidth;
    
    // Make sure it doesn't go off left edge
    if (leftPosition < 8) {
      leftPosition = 8;
    }
  }
  
  // Check if panel would go below viewport
  const panelHeight = isMobile ? screenHeight * 0.7 : 600;
  const wouldOverflow = topPosition + panelHeight > screenHeight;
  
  return (
    <div 
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] overflow-hidden flex flex-col"
      style={{ 
        fontFamily: 'Poppins, sans-serif',
        // Use the same multiplier for the fallback top when computing overflow
        top: wouldOverflow && isMobile ? `${buttonRect.bottom + 8}px` : `${topPosition}px`,
        left: `${leftPosition}px`,
        width: `${panelWidth}px`,
        maxHeight: wouldOverflow && isMobile ? `${screenHeight - topPosition - 16}px` : (isMobile ? '70vh' : '600px')
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-[#103C2E] text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2 py-3 text-xs font-medium transition-colors relative ${
            activeTab === 'all'
              ? 'text-[#103C2E] bg-white border-b-2 border-[#103C2E]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>All</span>
            {getTabCount('all') > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                {getTabCount('all') > 99 ? '99+' : getTabCount('all')}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-2 py-3 text-xs font-medium transition-colors relative ${
            activeTab === 'orders'
              ? 'text-[#103C2E] bg-white border-b-2 border-[#103C2E]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Orders</span>
            {getTabCount('orders') > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                {getTabCount('orders') > 99 ? '99+' : getTabCount('orders')}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-2 py-3 text-xs font-medium transition-colors relative ${
            activeTab === 'messages'
              ? 'text-[#103C2E] bg-white border-b-2 border-[#103C2E]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Msg</span>
            {getTabCount('messages') > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                {getTabCount('messages') > 99 ? '99+' : getTabCount('messages')}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-2 py-3 text-xs font-medium transition-colors relative ${
            activeTab === 'system'
              ? 'text-[#103C2E] bg-white border-b-2 border-[#103C2E]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>System</span>
            {getTabCount('system') > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                {getTabCount('system') > 99 ? '99+' : getTabCount('system')}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm font-medium">No {activeTab !== 'all' ? activeTab : ''} notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => onClose()}
                className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                  )}
                </div>
              </Link>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={loading}
                className="w-full py-3 text-sm text-[#103C2E] hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
