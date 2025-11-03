"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import { useChatSocket } from '@/hooks/useChatSocket';
import { NotificationHandler } from '@/components/NotificationHandler';

// Helper function to generate conversation ID
function generateConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

interface Conversation {
  conversationId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function BuyerInboxPage() {
  const { user } = useAuthUserData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [badgeShake, setBadgeShake] = useState(false);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readBatchRef = useRef<Set<string>>(new Set());
  const readBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Handle URL parameter ?userId= to open conversation with specific user
  useEffect(() => {
    const userId = searchParams?.get('userId');
    
    if (userId && user?.id && !selectedConversation) {
      // Check if conversation already exists in list
      const existingConv = conversations.find(conv => conv.userId === userId);
      
      if (existingConv) {
        // Open existing conversation
        handleConversationClick(existingConv);
      } else if (!loadingUserInfo) {
        // Fetch user info and create new conversation placeholder
        setLoadingUserInfo(true);
        fetch(`/api/users/${userId}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              const newConv: Conversation = {
                conversationId: generateConversationId(user.id, userId),
                userId: userId,
                userName: data.user.name || data.user.email || 'Unknown User',
                userImage: data.user.profilePicture || data.user.profileImage || null,
                lastMessage: 'Start a conversation',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0
              };
              
              setSelectedConversation(newConv);
              setShowSidebar(false);
              setMessages([]);
            }
          })
          .catch(err => console.error('Failed to fetch user info:', err))
          .finally(() => setLoadingUserInfo(false));
      }
    }
  }, [searchParams, user?.id, conversations, selectedConversation, loadingUserInfo]);

  // Memoized callbacks to prevent unnecessary socket reconnections
  const handleNewMessage = useCallback((message: Message) => {
    const currentConversation = selectedConversationRef.current;
    
    // Only add to messages state if this message belongs to the currently selected conversation
    if (currentConversation) {
      const isRelevantToCurrentConversation = 
        (message.senderId === user?.id && message.receiverId === currentConversation.userId) ||
        (message.senderId === currentConversation.userId && message.receiverId === user?.id);
      
      if (isRelevantToCurrentConversation) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          
          // Add and sort
          const updated = [...prev, message].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          return updated;
        });
        
        // Auto-scroll after adding message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
    // Always update conversation list
    setConversations(prev => {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      
      const updated = prev.map(conv => {
        if (conv.userId === otherUserId) {
          const shouldIncrementUnread = message.senderId !== user?.id && 
                                       (!currentConversation || currentConversation.userId !== otherUserId);
          
          return {
            ...conv,
            lastMessage: message.message,
            lastMessageTime: message.createdAt,
            unreadCount: shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount
          };
        }
        return conv;
      });
      
      // Sort conversations by last message time
      return updated.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
    });
  }, [user?.id]);

  const handleTyping = useCallback((data: { userId: string; isTyping: boolean }) => {
    if (data.isTyping) {
      setTypingUsers(prev => new Set(prev).add(data.userId));
    } else {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    }
  }, []);

  // Handle unread count updates
  const handleUnreadUpdate = useCallback((data: { totalUnread: number; conversationId?: string }) => {
    setTotalUnreadCount(data.totalUnread);
    
    // Trigger shake animation
    if (data.totalUnread > totalUnreadCount) {
      setBadgeShake(true);
      setTimeout(() => setBadgeShake(false), 600);
    }
  }, [totalUnreadCount]);

  // Handle read receipts
  const handleReadReceipt = useCallback((data: { conversationId: string; messageIds: string[]; readAt: Date }) => {
    setMessages(prev => prev.map(msg =>
      data.messageIds.includes(msg._id)
        ? { ...msg, isRead: true, readAt: data.readAt.toString() }
        : msg
    ));
  }, []);

  // Real-time chat with Socket.IO
  const { isConnected, sendTypingIndicator, joinConversation, markAsRead } = useChatSocket({
    userId: user?.id,
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onUnreadUpdate: handleUnreadUpdate,
    onReadReceipt: handleReadReceipt
  });

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?search=${searchQuery}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string, silent = false) => {
    try {
      const response = await fetch(`/api/chat/messages/${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Only update if messages changed (avoid unnecessary re-renders)
        setMessages(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newMessages)) {
            return prev;
          }
          return newMessages;
        });
        
        // Only auto-scroll if not silent fetch OR if user is already at bottom
        if (!silent) {
          scrollToBottom();
        }
        
        setConversations(prev =>
          prev.map(conv =>
            conv.userId === userId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message - show immediately
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: user?.id || '',
      senderName: (user as any)?.name || user?.email || 'You',
      receiverId: selectedConversation.userId,
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Add message to UI immediately (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    scrollToBottom();
    
    // Start sending indicator
    setSending(true);

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          message: messageText
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Replace optimistic message with real message from server
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? data.message : msg
        ));
        
        // Update conversation list
        fetchConversations();
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        setNewMessage(messageText); // Restore message text
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setNewMessage(messageText); // Restore message text
      alert('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle input typing with auto-timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!selectedConversation) return;

    const now = Date.now();
    const THROTTLE_MS = 2000; // Max once per 2 seconds

    // Throttle typing:start emission
    if (e.target.value.length > 0) {
      if (now - lastTypingEmitRef.current >= THROTTLE_MS) {
        sendTypingIndicator(selectedConversation.userId, true);
        lastTypingEmitRef.current = now;
      }
    } else {
      // Immediately send typing:stop when input is cleared
      sendTypingIndicator(selectedConversation.userId, false);
      lastTypingEmitRef.current = 0;
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-clear typing after 3 seconds of no input
    if (e.target.value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(selectedConversation.userId, false);
        lastTypingEmitRef.current = 0;
      }, 3000);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  // Auto-refresh messages every 3 seconds (fallback for socket issues)
  useEffect(() => {
    if (!selectedConversation) return;

    const intervalId = setInterval(() => {
      fetchMessages(selectedConversation.userId, true); // Silent refresh
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(intervalId);
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // IntersectionObserver for read receipts
  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    // Batch emit read receipts
    const batchEmitReadReceipts = () => {
      if (readBatchRef.current.size === 0) return;

      const messageIds = Array.from(readBatchRef.current);
      const conversationId = selectedConversation.conversationId || 
        [user.id, selectedConversation.userId].sort().join('_');

      // Emit via Socket.IO for real-time
      if (markAsRead) {
        markAsRead(conversationId, messageIds);
      }

      readBatchRef.current.clear();
    };

    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const isIncoming = entry.target.getAttribute('data-incoming') === 'true';
            const isUnread = entry.target.getAttribute('data-unread') === 'true';

            if (messageId && isIncoming && isUnread) {
              readBatchRef.current.add(messageId);

              // Debounce batch emit
              if (readBatchTimeoutRef.current) {
                clearTimeout(readBatchTimeoutRef.current);
              }
              readBatchTimeoutRef.current = setTimeout(batchEmitReadReceipts, 500);
            }
          }
        });
      },
      { threshold: 0.5 } // 50% visible
    );

    // Observe all message elements
    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
      if (readBatchTimeoutRef.current) {
        clearTimeout(readBatchTimeoutRef.current);
      }
    };
  }, [selectedConversation, messages, user?.id, markAsRead]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleConversationClick = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowSidebar(false); // Hide sidebar on mobile when conversation is selected
    fetchMessages(conv.userId);
    
    // Join the conversation room for real-time updates
    if (conv.conversationId) {
      joinConversation(conv.conversationId);
    }
  };

  return (
    <>
      <NotificationHandler />
      <div className="h-[calc(100vh-4rem)] flex bg-white rounded-none md:rounded-lg shadow-none md:shadow-lg overflow-hidden" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Left Sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-96 bg-white border-r border-gray-200 flex-col`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] p-3 md:p-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center space-x-2">
              {/* Back button for mobile - only show when NOT in conversation list view */}
              {!showSidebar && (
                <button
                  onClick={() => router.push('/')}
                  className="md:hidden text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
              )}
              <h1 className="text-white font-semibold text-base md:text-lg">Messages</h1>
            </div>
            {totalUnreadCount > 0 && (
              <div className="relative">
                <span className={`bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center ${badgeShake ? 'animate-pulse' : ''}`}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#103C2E] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#103C2E] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#103C2E] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-300 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Messages from sellers will appear here</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => handleConversationClick(conv)}
                className={`w-full p-3 md:p-4 flex items-center space-x-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation ${
                  selectedConversation?.conversationId === conv.conversationId ? 'bg-green-50 border-l-4 border-l-[#103C2E]' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#103C2E] to-[#1a5f3f] flex items-center justify-center overflow-hidden">
                    {conv.userImage ? (
                      <img src={conv.userImage} alt={conv.userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-xs md:text-sm">{getInitials(conv.userName)}</span>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center animate-pulse">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm md:text-sm text-gray-900 truncate pr-2">{conv.userName}</h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false }).replace('about ', '')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5 pr-2">{conv.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            <div className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] p-3 md:p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                {/* Back button for mobile - returns to conversation list */}
                <button
                  onClick={() => {
                    // Check if we came from a notification (has userId param)
                    const userId = searchParams?.get('userId');
                    if (userId) {
                      // If from notification, go back to home
                      router.push('/message');
                    } else {
                      // If from normal navigation, return to conversation list
                      setSelectedConversation(null);
                      setShowSidebar(true);
                      // Clear any URL parameters
                      router.replace('/inbox');
                    }
                  }}
                  className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                  aria-label="Back to conversations"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedConversation.userImage ? (
                    <img src={selectedConversation.userImage} alt={selectedConversation.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold text-xs md:text-sm">{getInitials(selectedConversation.userName)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-sm md:text-base truncate">{selectedConversation.userName}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-white/70 text-xs">Seller</p>
                    {isConnected && (
                      <span className="flex items-center gap-1 text-white/70 text-xs">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="hidden sm:inline">Online</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#e8f5e9]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-300 mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-4">
                  {messages
                    .filter((msg) => {
                      // Show messages that belong to current conversation
                      const otherUserId = selectedConversation?.userId;
                      return (
                        (msg.senderId === user?.id && msg.receiverId === otherUserId) ||
                        (msg.receiverId === user?.id && msg.senderId === otherUserId)
                      );
                    })
                    .map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      const isIncoming = msg.receiverId === user?.id;
                      const isPending = msg._id.startsWith('temp-');
                      return (
                        <div 
                          key={msg._id} 
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isPending ? 'opacity-70' : 'opacity-100'} transition-opacity px-1`}
                          data-message-id={msg._id}
                          data-incoming={isIncoming}
                          data-unread={!msg.isRead}
                        >
                          <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm ${
                            isOwn
                              ? 'bg-gradient-to-r from-[#2d7a54] to-[#1a5f3f] text-white rounded-br-none'
                              : 'bg-white text-gray-900 rounded-bl-none'
                          }`}>
                            <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                            <div className={`flex items-center justify-between gap-2 mt-1 md:mt-1.5 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                              <p className="text-xs">
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                              {isOwn && (
                                <div className="flex items-center gap-1 text-xs">
                                  {isPending ? (
                                    <svg className="w-3 h-3 text-white/50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                                    </svg>
                                  ) : msg.isRead ? (
                                    <>
                                      <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" transform="translate(3, 0)"/>
                                      </svg>
                                    </>
                                  ) : (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* Typing indicator */}
                  {typingUsers.has(selectedConversation.userId) && (
                    <div className="flex justify-start px-1">
                      <div className="bg-white rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm rounded-bl-none">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="bg-white p-3 md:p-4 border-t border-gray-200 shadow-lg">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3">
                <button
                  type="button"
                  className="text-gray-500 hover:text-[#103C2E] transition-colors p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 md:px-5 md:py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103C2E] focus:border-transparent text-sm disabled:opacity-50 bg-gray-50 touch-manipulation"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] text-white p-2.5 md:p-3.5 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 touch-manipulation"
                >
                  {sending ? (
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#e8f5e9] p-4">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-[#103C2E] to-[#1a5f3f] flex items-center justify-center shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 md:w-16 md:h-16 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Buyer Messages</h3>
              <p className="text-gray-600 text-sm">Select a conversation to chat with sellers</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
