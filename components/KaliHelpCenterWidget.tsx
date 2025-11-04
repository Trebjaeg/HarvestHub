"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, ChevronLeft, Loader2, HelpCircle, Mail } from 'lucide-react';
import Image from 'next/image';
import faqData from '@/data/kali-faqs.json';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface QuickResponse {
  id: string;
  label: string;
  message: string;
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

interface SupportConversation {
  _id: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: string;
}

type ViewMode = 'welcome' | 'faq' | 'chat';

export default function KaliHelpCenterWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [isAIChatMode, setIsAIChatMode] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState({
    issueType: '',
    description: '',
    urgency: ''
  });
  const [chatStep, setChatStep] = useState(0);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const faqs: FAQ[] = faqData.general;
  const quickResponses: QuickResponse[] = faqData.quickResponses;

  const filteredFAQs = searchQuery.trim()
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : faqs;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 3 seconds when connected to admin
  useEffect(() => {
    if (!conversation || isAIChatMode) return;

    const intervalId = setInterval(() => {
      loadMessages(conversation._id);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [conversation, isAIChatMode]);

  const getCurrentUserId = () => {
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

  const handleFAQClick = (faq: FAQ) => {
    const kaliMessage: Message = {
      senderId: 'kali',
      senderName: 'Kali',
      senderRole: 'ai',
      message: faq.answer,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    setMessages([
      {
        senderId: getCurrentUserId() || 'user',
        senderName: 'You',
        senderRole: 'buyer',
        message: faq.question,
        createdAt: new Date().toISOString(),
        isRead: true,
      },
      kaliMessage,
    ]);

    setViewMode('chat');
    setSearchQuery('');
  };

  const handleQuickResponse = (quickResponse: QuickResponse) => {
    const matchedFAQ = faqs.find((faq) => faq.question === quickResponse.message);
    if (matchedFAQ) {
      handleFAQClick(matchedFAQ);
    }
  };

  const handleContactSupport = () => {
    // Start AI chat flow instead of immediately connecting to admin
    setIsAIChatMode(true);
    setViewMode('chat');
    setChatStep(0);
    
    const welcomeMessage: Message = {
      senderId: 'kali',
      senderName: 'Kali',
      senderRole: 'ai',
      message: "Hi! I'm Kali, your support assistant. I'll help gather some information before connecting you to our support team.\n\nFirst, what type of issue are you experiencing?\n\n1. Order & Delivery\n2. Payment & Refunds\n3. Account Issues\n4. Product Questions\n5. Other",
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    
    setMessages([welcomeMessage]);
  };

  const handleAIChatMessage = async (userMessage: string) => {
    const userMsg: Message = {
      senderId: getCurrentUserId() || 'user',
      senderName: 'You',
      senderRole: 'buyer',
      message: userMessage,
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    
    setMessages((prev) => [...prev, userMsg]);

    let kaliResponse = '';
    const nextStep = chatStep + 1;

    switch (chatStep) {
      case 0:
        const issueTypes = ['Order & Delivery', 'Payment & Refunds', 'Account Issues', 'Product Questions', 'Other'];
        const selectedType = issueTypes[parseInt(userMessage) - 1] || userMessage;
        
        setCollectedInfo((prev) => ({ ...prev, issueType: selectedType }));
        kaliResponse = `Got it! You're experiencing issues with ${selectedType}.\n\nPlease describe your issue in detail. The more information you provide, the better we can assist you.`;
        break;

      case 1:
        setCollectedInfo((prev) => ({ ...prev, description: userMessage }));
        kaliResponse = "Thank you for the details!\n\nHow urgent is this issue?\n\n1. Critical (Immediate attention needed)\n2. High (Need response within 24 hours)\n3. Medium (Can wait 2-3 days)\n4. Low (Not urgent)";
        break;

      case 2:
        const urgencyLevels = ['Critical', 'High', 'Medium', 'Low'];
        const selectedUrgency = urgencyLevels[parseInt(userMessage) - 1] || userMessage;
        
        setCollectedInfo((prev) => ({ ...prev, urgency: selectedUrgency }));
        kaliResponse = `Perfect! I've collected all the information.\n\nIssue Type: ${collectedInfo.issueType}\nDescription: ${collectedInfo.description}\nUrgency: ${selectedUrgency}\n\nI'm now connecting you with our support team. A human agent will be with you shortly to assist with your ${collectedInfo.issueType} issue.`;
        
        setTimeout(() => {
          createSupportConversation();
        }, 2000);
        break;

      default:
        kaliResponse = "I'm connecting you with our support team now...";
    }

    const kaliMsg: Message = {
      senderId: 'kali',
      senderName: 'Kali',
      senderRole: 'ai',
      message: kaliResponse,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, kaliMsg]);
      setChatStep(nextStep);
    }, 800);
  };

  const createSupportConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/support/conversation', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success && data.conversation) {
        setConversation(data.conversation);
        setIsAIChatMode(false);

        const initialMessage = `Issue Type: ${collectedInfo.issueType}\nUrgency: ${collectedInfo.urgency}\n\nDescription:\n${collectedInfo.description}`;
        
        await fetch(`/api/support/${data.conversation._id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: initialMessage }),
        });

        await loadMessages(data.conversation._id);

        const connectedMessage: Message = {
          senderId: 'kali',
          senderName: 'Kali',
          senderRole: 'ai',
          message: "✅ You're now connected to our support team! A support agent will review your case and respond shortly. You can continue chatting here.",
          createdAt: new Date().toISOString(),
          isRead: true,
        };

        setMessages((prev) => [...prev, connectedMessage]);
      }
    } catch {
      const errorMessage: Message = {
        senderId: 'kali',
        senderName: 'Kali',
        senderRole: 'ai',
        message: "Sorry, I'm having trouble connecting to our support team right now. Please try again in a moment.",
        createdAt: new Date().toISOString(),
        isRead: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/support/${conversationId}/messages`);
      const data = await response.json();

      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch {
      console.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    if (isAIChatMode) {
      setIsSending(true);
      await handleAIChatMessage(messageText);
      setIsSending(false);
      return;
    }

    if (!conversation) return;

    setIsSending(true);

    const optimisticMessage: Message = {
      senderId: getCurrentUserId() || 'user',
      senderName: 'You',
      senderRole: 'buyer',
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/support/${conversation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.message) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id || m !== optimisticMessage);
          return [...filtered, data.message];
        });
        
        setTimeout(() => loadMessages(conversation._id), 500);
      } else {
        setMessages((prev) => prev.filter((m) => m !== optimisticMessage));
        console.error('Failed to send message:', data.message);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m !== optimisticMessage));
      console.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Draggable handlers for both mouse and touch
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x - (window.innerWidth <= 640 ? 16 : 24); // Adjust for mobile margins
      const newY = e.clientY - dragOffset.y - (window.innerWidth <= 640 ? 16 : 24);

      const buttonSize = window.innerWidth <= 640 ? 48 : 64; // Mobile: 48px, Desktop: 64px
      const margin = window.innerWidth <= 640 ? 16 : 24; // Mobile: 16px, Desktop: 24px
      
      const maxX = window.innerWidth - buttonSize - margin;
      const maxY = window.innerHeight - buttonSize - margin;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging

      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x - (window.innerWidth <= 640 ? 16 : 24);
      const newY = touch.clientY - dragOffset.y - (window.innerWidth <= 640 ? 16 : 24);

      const buttonSize = window.innerWidth <= 640 ? 48 : 64;
      const margin = window.innerWidth <= 640 ? 16 : 24;
      
      const maxX = window.innerWidth - buttonSize - margin;
      const maxY = window.innerHeight - buttonSize - margin;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button with Animation */}
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-50 group overflow-hidden touch-manipulation"
          aria-label="Open Kali Help Chat"
          style={{
            animation: 'float 3s ease-in-out infinite',
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
        >
          {/* Kali Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src="/images/kalichatbot.jpg"
              alt="Kali Assistant"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <span className="absolute -top-10 sm:-top-12 right-0 bg-gray-900 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Need help? Ask Kali!
          </span>
          
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-4 sm:bottom-6 sm:right-6 sm:inset-auto sm:w-96 sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {viewMode !== 'welcome' && (
                <button
                  onClick={() => {
                    // Allow closing chat even with active conversation
                    if (viewMode === 'chat') {
                      setViewMode('welcome');
                      setMessages([]);
                      setConversation(null);
                      setIsAIChatMode(false);
                      setChatStep(0);
                      setCollectedInfo({ issueType: '', description: '', urgency: '' });
                    } else if (viewMode === 'faq') {
                      setViewMode('welcome');
                      setSearchQuery('');
                    }
                  }}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors touch-manipulation"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {/* Kali Avatar in Header */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/30 relative flex-shrink-0">
                <Image
                  src="/images/kalichatbot.jpg"
                  alt="Kali"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg truncate">Kali</h3>
                <p className="text-xs text-white/80 truncate">Your HarvestHub Assistant</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => {
                  setViewMode('welcome');
                  setMessages([]);
                  setConversation(null);
                  setSearchQuery('');
                  setIsAIChatMode(false);
                  setChatStep(0);
                  setCollectedInfo({ issueType: '', description: '', urgency: '' });
                }, 300);
              }}
              className="hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors touch-manipulation flex-shrink-0"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            {/* Welcome Screen */}
            {viewMode === 'welcome' && (
              <div className="p-4 sm:p-6 h-full flex flex-col">
                <div className="text-center mb-4 sm:mb-6">
                  {/* Kali Avatar in Welcome Screen */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-green-500 shadow-lg relative">
                    <Image
                      src="/images/kalichatbot.jpg"
                      alt="Kali"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                    Hi! I&apos;m Kali
                  </h4>
                  <p className="text-gray-600 text-sm">
                    How can I help you today?
                  </p>
                </div>

                <div className="space-y-3 mb-4 sm:mb-6">
                  <button
                    onClick={() => setViewMode('faq')}
                    className="w-full bg-white border-2 border-green-500 text-green-600 py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold hover:bg-green-50 active:bg-green-100 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 touch-manipulation"
                  >
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">View FAQs</span>
                  </button>
                  <button
                    onClick={handleContactSupport}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="text-sm sm:text-base">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Contact Support</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <p className="text-xs text-gray-500 font-semibold mb-2 sm:mb-3 uppercase tracking-wide">
                    Quick Questions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto">
                    {quickResponses.slice(0, 6).map((quick) => (
                      <button
                        key={quick.id}
                        onClick={() => handleQuickResponse(quick)}
                        className="text-left bg-white border border-gray-200 p-2.5 sm:p-3 rounded-lg text-xs hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-all touch-manipulation"
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FAQ View */}
            {viewMode === 'faq' && (
              <div className="h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b bg-white flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm touch-manipulation"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  {filteredFAQs.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {filteredFAQs.map((faq) => (
                        <button
                          key={faq.id}
                          onClick={() => handleFAQClick(faq)}
                          className="w-full text-left bg-white border border-gray-200 p-3 sm:p-4 rounded-lg hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-all group touch-manipulation"
                        >
                          <p className="font-semibold text-sm text-gray-800 group-hover:text-green-600 mb-1">
                            {faq.question}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {faq.answer}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-gray-500 text-sm mb-3">No FAQs found</p>
                      <button
                        onClick={handleContactSupport}
                        className="text-green-600 text-sm font-semibold hover:underline touch-manipulation"
                      >
                        Contact support instead
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat View */}
            {viewMode === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.senderId === getCurrentUserId();
                    const isKali = msg.senderRole === 'ai';
                    const isAdmin = msg.senderRole === 'admin';

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                            isCurrentUser
                              ? 'bg-green-500 text-white'
                              : isKali
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border border-purple-200'
                              : isAdmin
                              ? 'bg-blue-100 text-gray-800 border border-blue-200'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {!isCurrentUser && (
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input field - show for both AI chat mode and connected conversation */}
                <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isAIChatMode ? "Type your response..." : "Type your message..."}
                      disabled={isSending}
                      className="flex-1 px-3 py-2.5 sm:px-4 sm:py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isSending}
                      className="bg-green-500 text-white p-2 sm:p-2.5 rounded-full hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
