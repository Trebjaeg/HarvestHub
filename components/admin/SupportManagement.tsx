'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail,
  Phone,
  AlertTriangle,
  Eye,
  Filter,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface SupportTicket {
  _id: string;
  ticketId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'account' | 'technical' | 'billing' | 'order' | 'general';
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    message: string;
    respondedBy: {
      firstName: string;
      lastName: string;
      email: string;
    };
    respondedAt: string;
  }>;
}

const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTickets: SupportTicket[] = [
        {
          _id: '1',
          ticketId: 'HH-2025-001',
          subject: 'Unable to upload product images',
          message: 'I am trying to upload images for my vegetables but the upload keeps failing. I have tried multiple times but it shows an error message.',
          status: 'open',
          priority: 'high',
          category: 'technical',
          user: {
            _id: 'user1',
            firstName: 'Maria',
            lastName: 'Santos',
            email: 'maria.santos@email.com'
          },
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-15T10:30:00Z'
        },
        {
          _id: '2',
          ticketId: 'HH-2025-002',
          subject: 'Payment not reflected in account',
          message: 'I made a payment 3 days ago but it is still not showing in my seller account. The transaction ID is TXN123456789.',
          status: 'in_progress',
          priority: 'urgent',
          category: 'billing',
          user: {
            _id: 'user2',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            email: 'juan.delacruz@email.com'
          },
          assignedTo: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'Support',
            email: 'support@harvesthub.ph'
          },
          createdAt: '2025-01-14T14:20:00Z',
          updatedAt: '2025-01-15T09:15:00Z',
          responses: [
            {
              message: 'Thank you for contacting us. We are investigating this payment issue and will get back to you within 24 hours.',
              respondedBy: {
                firstName: 'Admin',
                lastName: 'Support',
                email: 'support@harvesthub.ph'
              },
              respondedAt: '2025-01-14T15:30:00Z'
            }
          ]
        },
        {
          _id: '3',
          ticketId: 'HH-2025-003',
          subject: 'How to change delivery address',
          message: 'I need to update my delivery address for future orders. Where can I find this option in my account?',
          status: 'resolved',
          priority: 'low',
          category: 'account',
          user: {
            _id: 'user3',
            firstName: 'Ana',
            lastName: 'Reyes',
            email: 'ana.reyes@email.com'
          },
          assignedTo: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'Support',
            email: 'support@harvesthub.ph'
          },
          createdAt: '2025-01-13T11:45:00Z',
          updatedAt: '2025-01-13T16:20:00Z'
        }
      ];
      setTickets(mockTickets);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <MessageSquare className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${ticket.user.firstName} ${ticket.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Help Center Management
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Help Center Management
          </h2>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Manage customer support tickets and help center content
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/help" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>View Help Center</span>
            </Button>
          </Link>
          <Button className="bg-green-600 hover:bg-green-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.openTickets}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets by ID, subject, or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Support Tickets ({filteredTickets.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                No support tickets found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900">{ticket.ticketId}</span>
                        <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{ticket.subject}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{ticket.user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(ticket.createdAt)}</span>
                        </div>
                      </div>
                      
                      {ticket.assignedTo && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Assigned to: </span>
                          <span className="font-medium">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTicketDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  
                  {ticket.responses && ticket.responses.length > 0 && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-sm text-gray-500 mb-1">
                        Latest response by {ticket.responses[ticket.responses.length - 1].respondedBy.firstName} {ticket.responses[ticket.responses.length - 1].respondedBy.lastName}
                      </p>
                      <p className="text-sm text-gray-700 italic">
                        "{ticket.responses[ticket.responses.length - 1].message.substring(0, 100)}..."
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Help Center Management */}
      <Card>
        <CardHeader>
          <CardTitle>Help Center Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/help/buyer" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Buyer Help Pages
              </Button>
            </Link>
            <Link href="/help/seller" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Seller Help Pages
              </Button>
            </Link>
            <Link href="/help/admin" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Admin Help Pages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportManagement;