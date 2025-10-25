"use client";

import React, { useState, useEffect, useCallback } from 'react';
import LoadingDots from '@/components/ui/LoadingDots';
import { 
  Mail, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  Package, 
  Tag, 
  Bell, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface MessageData {
  _id: string;
  senderId?: string;
  senderType: 'system' | 'admin' | 'seller' | 'buyer';
  senderName: string;
  subject: string;
  content: string;
  category: 'order_update' | 'promotion' | 'system_notification' | 'general' | 'support';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  relatedOrderId?: string;
  relatedProductId?: string;
  metadata?: {
    orderStatus?: string;
    productName?: string;
    promotionCode?: string;
    expiryDate?: string;
    [key: string]: string | number | boolean | undefined;
  };
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MessagesStats {
  unreadCount: number;
  totalCount: number;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<Record<string, MessageData[]>>({});
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState<MessagesStats>({ unreadCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  // Categories and their display names
  const categories = [
    { value: 'all', label: 'All Messages', icon: Mail },
    { value: 'order_update', label: 'Order Updates', icon: Package },
    { value: 'promotion', label: 'Promotions', icon: Tag },
    { value: 'system_notification', label: 'System Notifications', icon: Bell },
    { value: 'general', label: 'General', icon: Mail },
    { value: 'support', label: 'Support', icon: AlertCircle }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' }
  ];

  const fetchMessages = useCallback(async (page: number = 1) => {
    try {
      setError(null);
      if (page === 1) setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (readFilter !== 'all') params.append('isRead', readFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/messages?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data.messages);
        setGroupedMessages(result.data.groupedMessages);
        setPagination(result.data.pagination);
        setStats(result.data.stats);
        setCurrentPage(result.data.pagination.currentPage);
      } else {
        throw new Error(result.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, selectedCategory, readFilter, priorityFilter]);

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      });

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        ));
        setStats(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
        
        if (selectedMessage && selectedMessage._id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, isRead: true } : null);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const toggleReadStatus = async (messageId: string, isCurrentlyRead: boolean) => {
    try {
      const action = isCurrentlyRead ? 'mark_unread' : 'mark_read';
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                isRead: !isCurrentlyRead, 
                readAt: !isCurrentlyRead ? new Date().toISOString() : undefined 
              } 
            : msg
        ));
        
        setStats(prev => ({
          ...prev,
          unreadCount: isCurrentlyRead ? prev.unreadCount + 1 : Math.max(0, prev.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        if (selectedMessage && selectedMessage._id === messageId) {
          setSelectedMessage(null);
        }
        setStats(prev => ({ ...prev, totalCount: prev.totalCount - 1 }));
      }
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const viewMessage = async (message: MessageData) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      await markAsRead(message._id);
    }
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    await fetchMessages(currentPage);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMessages(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setReadFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchMessages(page);
  };

  // Initial load - only run once
  useEffect(() => {
    fetchMessages(1);
  }, []);

  // Handle filter changes with debounce - remove fetchMessages dependency
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchMessages(1);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCategory, readFilter, priorityFilter, loading]);

  // Handle search term changes separately with debounce
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchMessages(1);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, loading]);

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    const IconComponent = categoryData?.icon || Mail;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const priorityData = priorities.find(p => p.value === priority);
    return priorityData?.color || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const MessageCard = ({ message }: { message: MessageData }) => (
    <div
      className={`bg-white rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
        message.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
      } ${selectedMessage?._id === message._id ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => viewMessage(message)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              {getCategoryIcon(message.category)}
              <span className="font-medium text-gray-900">{message.senderName}</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(message.priority)}`}>
              {message.priority}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {!message.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            <Clock className="w-3 h-3" />
            <span>{formatDate(message.createdAt)}</span>
          </div>
        </div>
        
        <h3 className={`font-semibold mb-2 ${message.isRead ? 'text-gray-800' : 'text-gray-900'}`}>
          {message.subject}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {message.content.substring(0, 150)}
          {message.content.length > 150 && '...'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {categories.find(cat => cat.value === message.category)?.label}
            </span>
            {message.metadata?.productName && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                {message.metadata.productName}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReadStatus(message._id, message.isRead);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={message.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {message.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveMessage(message._id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Archive message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const MessageModal = () => {
    if (!selectedMessage) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getCategoryIcon(selectedMessage.category)}
                <div>
                  <h2 className="text-lg font-semibold">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-600">From: {selectedMessage.senderName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{formatDate(selectedMessage.createdAt)}</span>
              <span className={`px-2 py-1 rounded-full ${getPriorityColor(selectedMessage.priority)}`}>
                {selectedMessage.priority} priority
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                {categories.find(cat => cat.value === selectedMessage.category)?.label}
              </span>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="prose max-w-none">
              {selectedMessage.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">{paragraph}</p>
              ))}
            </div>
            
            {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Additional Information</h4>
                <div className="space-y-1 text-sm">
                  {selectedMessage.metadata.productName && (
                    <p><strong>Product:</strong> {selectedMessage.metadata.productName}</p>
                  )}
                  {selectedMessage.metadata.orderStatus && (
                    <p><strong>Order Status:</strong> {selectedMessage.metadata.orderStatus}</p>
                  )}
                  {selectedMessage.metadata.promotionCode && (
                    <p><strong>Promo Code:</strong> {selectedMessage.metadata.promotionCode}</p>
                  )}
                  {selectedMessage.metadata.expiryDate && (
                    <p><strong>Expires:</strong> {new Date(selectedMessage.metadata.expiryDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex gap-2">
            <button
              onClick={() => toggleReadStatus(selectedMessage._id, selectedMessage.isRead)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
            </button>
            <button
              onClick={() => {
                archiveMessage(selectedMessage._id);
                setSelectedMessage(null);
              }}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Messages
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {stats.unreadCount > 0 ? (
                    <span className="text-blue-600 font-medium">
                      {stats.unreadCount} unread message{stats.unreadCount !== 1 ? 's' : ''} • {stats.totalCount} total
                    </span>
                  ) : (
                    <span>{stats.totalCount} messages • All read</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Filter className="w-4 h-4" />
                {viewMode === 'list' ? 'Group by Date' : 'List View'}
              </button>
              
              <button
                onClick={refreshMessages}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Filter */}
              <div>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Messages</option>
                  <option value="false">Unread Only</option>
                  <option value="true">Read Only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-600">Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingDots size="lg" color="#103C2E" />
            <span className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading messages...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refreshMessages}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {stats.unreadCount === 0 ? 'You have no new messages' : 'No messages found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || readFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search filters to find more messages.'
                : 'When you receive messages from the system, sellers, or support, they will appear here.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all' || readFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Messages List */}
            <div className="space-y-4 mb-8">
              {viewMode === 'list' ? (
                messages.map((message) => (
                  <MessageCard key={message._id} message={message} />
                ))
              ) : (
                Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                      {new Date(date).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                        ? 'Yesterday'
                        : new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                      }
                    </h3>
                    {dateMessages.map((message) => (
                      <MessageCard key={message._id} message={message} />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} messages
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg ${
                              page === pagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Message Modal */}
        <MessageModal />
      </div>
    </div>
  );
}