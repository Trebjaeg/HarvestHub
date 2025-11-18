"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import { useChatSocket } from '@/hooks/useChatSocket';
import { NotificationHandler } from '@/components/NotificationHandler';
import { Paperclip, X, Download, FileText, Image as ImageIcon } from 'lucide-react';

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

interface Attachment {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  type: string;
  size: number;
  category: 'image' | 'video' | 'document';
  uploadedBy: string;
  uploadedAt: string;
}

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  attachments?: Attachment[];
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const fetchConversations = useCallback(async () => {
    try {
      console.log('[BUYER] Fetching conversations for user:', user?.id, 'search:', searchQuery);
      const response = await fetch(`/api/chat/conversations?search=${searchQuery}`, {
        credentials: 'include',
        cache: 'no-store'
      });

      console.log('[BUYER] Response status:', response.status, 'ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[BUYER] Received data:', data);
        setConversations(data.conversations || []);
      } else {
        console.error('[BUYER] Response not ok:', await response.text());
      }
    } catch (error) {
      console.error('[BUYER] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

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

    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message - show immediately
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: user?.id || '',
      senderName: (user as any)?.name || user?.email || 'You',
      receiverId: selectedConversation.userId,
      message: messageText,
      attachments: attachments,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Add message to UI immediately (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setAttachments([]);
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
          message: messageText,
          attachments: attachments
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
        setAttachments(attachments); // Restore attachments
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setNewMessage(messageText); // Restore message text
      setAttachments(attachments); // Restore attachments
      alert('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      extension: file.name.split('.').pop()
    });

    // Get file extension (mobile cameras often don't set MIME type correctly)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check if valid by extension (primary check for mobile)
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    const allExtensions = [...imageExtensions, ...videoExtensions, ...docExtensions];
    
    const isValidByExtension = allExtensions.includes(fileExtension || '');
    
    // For mobile camera photos without extension, check if MIME type looks like image
    const isImageByMime = file.type.startsWith('image/');
    const isVideoByMime = file.type.startsWith('video/');
    
    // Determine if it's a video (for size validation)
    const isVideo = videoExtensions.includes(fileExtension || '') || isVideoByMime;
    const isImage = imageExtensions.includes(fileExtension || '') || isImageByMime;
    
    // Validate file type - be more lenient for mobile uploads
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    // Accept if: has valid extension OR valid MIME type OR empty MIME (mobile camera)
    const hasValidMime = allowedTypes.includes(file.type);
    const emptyMime = !file.type || file.type === '' || file.type === 'application/octet-stream';
    
    if (!hasValidMime && !isValidByExtension && !emptyMime) {
      console.error('❌ Invalid file type:', { type: file.type, extension: fileExtension });
      alert('Invalid file type. Please upload images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, MOV), or documents (PDF, Word, Excel, Text).');
      return;
    }
    
    // If empty MIME but no extension, assume it's an image from mobile camera
    if (emptyMime && !isValidByExtension && isImageByMime) {
      console.log('📸 Mobile camera photo detected (no extension)');
    }
    
    // Validate file size (100MB for videos, 10MB for others)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${isVideo ? '100MB' : '10MB'}`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('🔼 Uploading file:', { name: file.name, size: file.size, type: file.type });

      // Get token from localStorage for mobile browsers (cookies don't always work on mobile)
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      console.log('📥 Upload response:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload successful:', data);
        setAttachments(prev => [...prev, data.file]);
      } else {
        const contentType = response.headers.get('content-type');
        console.error('❌ Upload failed:', { status: response.status, contentType });
        
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          const errorMessage = error.details ? `${error.error}: ${error.details}` : error.error || 'Failed to upload file';
          alert(errorMessage);
        } else {
          // Got HTML instead of JSON
          const htmlText = await response.text();
          console.error('❌ Got HTML response instead of JSON:', htmlText.substring(0, 200));
          alert('Failed to upload file. Please make sure you are logged in and try again.');
        }
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    
    return `${truncatedName}...${extension}`;
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

  // Fetch conversations when user loads or search query changes
  useEffect(() => {
    if (!user?.id) return;
    
    const timer = setTimeout(() => {
      fetchConversations();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [user?.id, searchQuery, fetchConversations]);

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
                            {msg.message && (
                              <p className="text-sm break-words leading-relaxed mb-2">{msg.message}</p>
                            )}
                            
                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-2 mb-2">
                                {msg.attachments.map((attachment) => (
                                  <div key={attachment.id} className={`border rounded-lg p-2 ${isOwn ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50'}`}>
                                    {attachment.category === 'image' ? (
                                      <div className="relative">
                                        <img 
                                          src={attachment.url} 
                                          alt={attachment.originalName}
                                          className="max-w-full max-h-48 rounded cursor-pointer"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                        />
                                        <button
                                          onClick={() => window.open(attachment.url, '_blank')}
                                          className={`absolute top-2 right-2 p-1 rounded-full ${isOwn ? 'bg-black/20 hover:bg-black/30' : 'bg-white/80 hover:bg-white'} transition-colors`}
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : attachment.category === 'video' ? (
                                      <div className="relative">
                                        <video 
                                          src={attachment.url}
                                          controls
                                          className="max-w-full max-h-64 rounded"
                                          style={{ maxWidth: '100%' }}
                                        >
                                          Your browser does not support video playback.
                                        </video>
                                        <div className="mt-1">
                                          <p className="text-xs font-medium truncate" title={attachment.originalName}>
                                            {truncateFileName(attachment.originalName, 30)}
                                          </p>
                                          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate" title={attachment.originalName}>
                                            {truncateFileName(attachment.originalName, 30)}
                                          </p>
                                          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                        </div>
                                        <button
                                          onClick={() => window.open(attachment.url, '_blank')}
                                          className={`p-1 rounded transition-colors ${isOwn ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
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
              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                        {attachment.category === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                        ) : attachment.category === 'video' ? (
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <FileText className="w-4 h-4 text-gray-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={attachment.originalName}>
                            {truncateFileName(attachment.originalName, 25)}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2 md:space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-gray-500 hover:text-[#103C2E] transition-colors p-2 hover:bg-gray-100 rounded-lg touch-manipulation disabled:opacity-50"
                  title="Attach file"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-[#103C2E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder={attachments.length > 0 ? "Add a message (optional)" : "Type a message..."}
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={sending}
                    className="w-full px-4 py-2.5 md:px-5 md:py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103C2E] focus:border-transparent text-sm disabled:opacity-50 bg-gray-50 touch-manipulation"
                  />
                </div>
                <button
                  type="submit"
                  disabled={((!newMessage.trim() && attachments.length === 0) || sending)}
                  className="flex-shrink-0 bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] text-white p-2.5 md:p-3.5 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 touch-manipulation"
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
