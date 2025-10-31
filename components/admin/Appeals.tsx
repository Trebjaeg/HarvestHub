'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  FileText,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Image from 'next/image';

// Custom Filter Icon
const Filter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 6l8 0" />
    <path d="M16 6l4 0" />
    <path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 12l2 0" />
    <path d="M10 12l10 0" />
    <path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M4 18l11 0" />
    <path d="M19 18l1 0" />
  </svg>
);

interface Appeal {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  reason: string;
  originalAction: string;
  originalReason: string;
  originalDate: string;
  evidence?: Array<{
    type: string;
    content: string;
    description: string;
  }>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reviewedBy?: {
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  decision?: string;
  decisionReason?: string;
  createdAt: string;
}

export default function Appeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filteredAppeals, setFilteredAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  useEffect(() => {
    filterAppealsData();
  }, [appeals, searchQuery, filterStatus]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching appeals from admin API...');
      
      const response = await fetch('/api/admin/appeals', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('API Error Response:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorData = { error: 'Failed to parse error response', details: `Status: ${response.status}` };
        }
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: Failed to fetch appeals`);
      }

      const data = await response.json();
      console.log('Received data:', { 
        success: data.success,
        appealsCount: data.appeals?.length || 0,
        pagination: data.pagination,
        firstAppeal: data.appeals?.[0] ? {
          id: data.appeals[0]._id,
          type: data.appeals[0].type,
          status: data.appeals[0].status
        } : 'No appeals'
      });
      
      if (!data.success) {
        throw new Error(data.error || data.details || 'API returned success: false');
      }
      
      setAppeals(data.appeals || []);
    } catch (err: any) {
      console.error('Error fetching appeals:', err);
      setError(err.message || 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const filterAppealsData = () => {
    let filtered = [...appeals];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(appeal => appeal.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        appeal =>
          appeal.user?.name?.toLowerCase().includes(query) ||
          appeal.user?.email?.toLowerCase().includes(query) ||
          appeal.reason?.toLowerCase().includes(query) ||
          appeal.originalReason?.toLowerCase().includes(query)
      );
    }

    setFilteredAppeals(filtered);
  };

  const handleReview = async (appealId: string, decision: 'approved' | 'rejected') => {
    if (!reviewNotes.trim()) {
      setError('Review notes are required');
      return;
    }

    if (!decisionReason.trim()) {
      setError('Decision reason is required');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/appeals/${appealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          reviewNotes,
          decisionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process appeal');
      }

      await fetchAppeals();
      setSelectedAppeal(null);
      setReviewNotes('');
      setDecisionReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to process appeal');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode; label: string }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      under_review: { variant: 'default', icon: <Eye className="h-3 w-3" />, label: 'Under Review' },
      approved: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[priority] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="md" color="#40613D" />
          </div>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Appeals Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and manage user suspension appeals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredAppeals.length} Appeals
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#40613D]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Appeals List */}
      <div className="space-y-4">
        {filteredAppeals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No appeals found
            </h3>
            <p className="text-gray-500">
              {filterStatus !== 'all' || searchQuery
                ? 'Try adjusting your filters'
                : 'No appeals have been submitted yet'}
            </p>
          </div>
        ) : (
          filteredAppeals.map((appeal) => (
            <div
              key={appeal._id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {appeal.user?.name || 'Unknown User'}
                    </h3>
                    {getStatusBadge(appeal.status)}
                    {getPriorityBadge(appeal.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{appeal.user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {new Date(appeal.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Original Action */}
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded-r">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Original Action: {appeal.originalAction}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Reason:</strong> {appeal.originalReason}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Date: {new Date(appeal.originalDate).toLocaleDateString()}
                </p>
              </div>

              {/* Appeal Reason */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">User's Explanation:</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {appeal.reason}
                </p>
              </div>

              {/* Supporting Evidence */}
              {appeal.evidence && appeal.evidence.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Supporting Evidence ({appeal.evidence.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {appeal.evidence.map((ev, idx) => (
                      ev.type === 'image' && (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewingImage(ev.content)}
                        >
                          <Image
                            src={ev.content}
                            alt={`Evidence ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Review Section */}
              {appeal.status === 'pending' || appeal.status === 'under_review' ? (
                selectedAppeal?._id === appeal._id ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">
                        Review Notes <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Enter your review notes..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 font-medium">
                        Decision Reason <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Explain your decision..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReview(appeal._id, 'approved')}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Appeal
                      </Button>
                      <Button
                        onClick={() => handleReview(appeal._id, 'rejected')}
                        disabled={processing}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Appeal
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedAppeal(null);
                          setReviewNotes('');
                          setDecisionReason('');
                        }}
                        variant="outline"
                        disabled={processing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedAppeal(appeal)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Appeal
                  </Button>
                )
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Review Details:</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Reviewed by:</strong> {appeal.reviewedBy?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Decision:</strong> {appeal.decision}
                  </p>
                  {appeal.reviewNotes && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Review Notes:</strong> {appeal.reviewNotes}
                    </p>
                  )}
                  {appeal.decisionReason && (
                    <p className="text-sm text-gray-700">
                      <strong>Decision Reason:</strong> {appeal.decisionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={viewingImage}
                alt="Evidence"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
