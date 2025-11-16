"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportConversation {
  _id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: 'buyer' | 'seller';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
}

interface Message {
  _id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin' | 'ai';
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminSupportChatsPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false); // Start with false, only show loading on first fetch
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<SupportConversation | null>(null);
  const isFirstLoad = useRef(true);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const getCurrentAdminId = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id;
    } catch {
      return null;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load + auto-refresh combined
  useEffect(() => {
    // First load with loading indicator
    fetchConversations(isFirstLoad.current);
    isFirstLoad.current = false;

    // Auto-refresh conversations every 5 seconds (silent, no loading indicator)
    const intervalId = setInterval(() => {
      fetchConversations(false); // Background refresh without loading indicator
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Refresh conversations when search changes (without loading indicator)
  useEffect(() => {
    if (searchQuery !== '') {
      fetchConversations(false);
    }
  }, [searchQuery]);

  // Auto-refresh messages every 3 seconds when conversation is selected
  // NOTE: Initial message loading is handled in handleConversationClick
  useEffect(() => {
    if (!selectedConversation) return;

    // Only set up auto-refresh interval (no initial load here to avoid double loading)
    const intervalId = setInterval(() => {
      loadMessages(selectedConversation._id, false); // Background refresh (silent)
    }, 3000);

    return () => clearInterval(intervalId);
  }, [selectedConversation]);

  const fetchConversations = async (showLoadingIndicator: boolean = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/support/conversations?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations');
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (conversationId: string, showLoadingIndicator: boolean = true) => {
    if (showLoadingIndicator) {
      setMessagesLoading(true);
    }
    
    try {
      const response = await fetch(`/api/support/${conversationId}/messages`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.messages) {
        // Only update if messages actually changed (prevents unnecessary re-renders)
        const messagesChanged = JSON.stringify(data.messages) !== JSON.stringify(messages);
        if (messagesChanged) {
          setMessages(data.messages);
          
          // Only auto-scroll on initial load or when at bottom
          if (showLoadingIndicator) {
            scrollToBottom();
          }
        }
      }
    } catch (error) {
      console.error('Failed to load messages');
    } finally {
      if (showLoadingIndicator) {
        setMessagesLoading(false);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !selectedConversation || sending) return;

    const messageText = inputMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: getCurrentAdminId() || 'admin',
      senderName: 'Admin Support',
      senderRole: 'admin',
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInputMessage('');
    scrollToBottom();
    setSending(true);

    try {
      const response = await fetch(`/api/support/${selectedConversation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? data.message : msg
        ));

        // Refresh messages and conversations
        setTimeout(() => {
          loadMessages(selectedConversation._id, false); // Background refresh, no loading indicator
          fetchConversations(false); // Background refresh, no loading indicator
        }, 500);
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        setInputMessage(messageText);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setInputMessage(messageText);
      alert('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleConversationClick = (conv: SupportConversation) => {
    setSelectedConversation(conv);
    setShowSidebar(false);
    // Show loading indicator when user manually selects a conversation
    loadMessages(conv._id, true);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowSidebar(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Left Sidebar - Conversations List */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-96 bg-white border-r border-gray-200 flex-col`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-semibold text-lg">Support Chats</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
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
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium">No support conversations yet</p>
              <p className="text-xs mt-1">Support requests will appear here</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => handleConversationClick(conv)}
                className={`w-full p-4 flex items-center space-x-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedConversation?._id === conv._id ? 'bg-green-50 border-l-4 border-l-[#103C2E]' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#103C2E] to-[#1a5f3f] flex items-center justify-center overflow-hidden">
                    <span className="text-white font-semibold text-sm">{getInitials(conv.userName)}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{conv.userName}</h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDistanceToNow(new Date(conv.lastMessageAt || conv.createdAt), { addSuffix: false }).replace('about ', '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-600 truncate flex-1">{conv.lastMessagePreview || 'No messages yet'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      conv.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      conv.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {conv.status.replace('_', ' ')}
                    </span>
                  </div>
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
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToList}
                  className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <span className="text-white font-semibold text-sm">{getInitials(selectedConversation.userName)}</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold">{selectedConversation.userName}</h2>
                  <p className="text-white/70 text-xs capitalize">{selectedConversation.userRole}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#e8f5e9]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'admin';
                    const isAI = msg.senderRole === 'ai';
                    const isPending = msg._id?.startsWith('temp-');

                    return (
                      <div 
                        key={msg._id || idx} 
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${isPending ? 'opacity-70' : 'opacity-100'} transition-opacity`}
                      >
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                          isAdmin
                            ? 'bg-gradient-to-r from-[#2d7a54] to-[#1a5f3f] text-white rounded-br-none'
                            : isAI
                            ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border border-purple-200 rounded-bl-none'
                            : 'bg-white text-gray-900 rounded-bl-none'
                        }`}>
                          {!isAdmin && (
                            <p className={`text-xs font-semibold mb-1 ${isAI ? 'text-purple-600' : 'text-gray-600'}`}>
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                          <div className={`flex items-center justify-between gap-2 mt-1.5 ${isAdmin ? 'text-white/70' : 'text-gray-500'}`}>
                            <p className="text-xs">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            {isAdmin && (
                              <div className="flex items-center gap-1 text-xs">
                                {isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-white p-4 border-t border-gray-200 shadow-lg">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103C2E] focus:border-transparent text-sm disabled:opacity-50 bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="bg-gradient-to-r from-[#103C2E] to-[#1a5f3f] text-white p-3.5 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#e8f5e9]">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#103C2E] to-[#1a5f3f] flex items-center justify-center shadow-2xl">
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Support Center</h3>
              <p className="text-gray-600 text-sm">Select a conversation to view support messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
