'use client';

import { Card } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface Appeal {
  _id: string;
  user: string;
  productId?: string;
  productName?: string;
  type: 'suspension' | 'deletion' | 'warning' | 'listing_removal';
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  decision?: 'approved' | 'rejected' | 'partial';
  decisionReason?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/appeals', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setAppeals(data);
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppeals = filter === 'all' 
    ? appeals 
    : appeals.filter(appeal => appeal.status === filter);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: '#FFA726',
          bg: '#FFF3E0',
          label: 'Pending',
          icon: Clock
        };
      case 'under_review':
        return {
          color: '#42A5F5',
          bg: '#E3F2FD',
          label: 'Under Review',
          icon: AlertCircle
        };
      case 'approved':
        return {
          color: '#4A7C59',
          bg: '#E8F5E9',
          label: 'Approved',
          icon: CheckCircle
        };
      case 'rejected':
        return {
          color: '#EF5350',
          bg: '#FFEBEE',
          label: 'Rejected',
          icon: XCircle
        };
      default:
        return {
          color: '#757575',
          bg: '#F5F5F5',
          label: status,
          icon: FileText
        };
    }
  };

  const statusCounts = {
    all: appeals.length,
    pending: appeals.filter(a => a.status === 'pending').length,
    under_review: appeals.filter(a => a.status === 'under_review').length,
    approved: appeals.filter(a => a.status === 'approved').length,
    rejected: appeals.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
              <FileText className="w-6 h-6 md:w-8 md:h-8" style={{ color: '#4A7C59' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#103C2E' }}>
                My Appeals
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track and manage your product and account appeals
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6 p-2 bg-white border border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: filter === 'all' ? '#4A7C59' : 'transparent'
              }}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilter('under_review')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'under_review'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Under Review ({statusCounts.under_review})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: filter === 'approved' ? '#4A7C59' : 'transparent'
              }}
            >
              Approved ({statusCounts.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rejected ({statusCounts.rejected})
            </button>
          </div>
        </Card>

        {/* Appeals List */}
        {loading ? (
          <Card className="p-6 bg-white border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ) : filteredAppeals.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No appeals found
            </h3>
            <p className="text-gray-600">
              {filter !== 'all' 
                ? `You don't have any ${filter.replace('_', ' ')} appeals`
                : "You haven't submitted any appeals yet"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppeals.map((appeal) => {
              const statusConfig = getStatusConfig(appeal.status);
              const StatusIcon = statusConfig.icon;
              const isProductAppeal = appeal.type === 'listing_removal';

              return (
                <Card 
                  key={appeal._id} 
                  className="bg-white border-2 hover:shadow-lg transition-shadow"
                  style={{ borderColor: statusConfig.color }}
                >
                  <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-base md:text-lg" style={{ color: '#103C2E' }}>
                            {isProductAppeal ? (appeal.productName || 'Product Appeal') : 'Account Appeal'}
                          </h3>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                            style={{ 
                              backgroundColor: statusConfig.bg,
                              color: statusConfig.color
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">
                          Submitted on {new Date(appeal.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Appeal Type */}
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 uppercase">Appeal Type</span>
                      <p className="text-sm md:text-base text-gray-700 capitalize">
                        {appeal.type.replace('_', ' ')}
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 uppercase">Your Reason</span>
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4 mt-2">
                        <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">
                          {appeal.reason}
                        </p>
                      </div>
                    </div>

                    {/* Decision Section */}
                    {(appeal.status === 'approved' || appeal.status === 'rejected') && (
                      <div 
                        className="rounded-lg p-4 border-l-4 mt-4"
                        style={{ 
                          backgroundColor: appeal.status === 'approved' ? '#E8F5E9' : '#FFEBEE',
                          borderColor: appeal.status === 'approved' ? '#4A7C59' : '#EF5350'
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {appeal.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4A7C59' }} />
                          ) : (
                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EF5350' }} />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm md:text-base mb-2" style={{ 
                              color: appeal.status === 'approved' ? '#103C2E' : '#C62828'
                            }}>
                              Admin Decision: {appeal.status === 'approved' ? 'Appeal Approved ✓' : 'Appeal Rejected ✗'}
                            </p>
                            {appeal.decisionReason && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-600 uppercase">Reason</span>
                                <p className="text-sm md:text-base mt-1" style={{ 
                                  color: appeal.status === 'approved' ? '#4A7C59' : '#D32F2F'
                                }}>
                                  {appeal.decisionReason}
                                </p>
                              </div>
                            )}
                            {appeal.reviewNotes && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-600 uppercase">Admin Notes</span>
                                <p className="text-sm mt-1 text-gray-700">
                                  {appeal.reviewNotes}
                                </p>
                              </div>
                            )}
                            {appeal.reviewedAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Reviewed on {new Date(appeal.reviewedAt).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pending/Under Review Message */}
                    {(appeal.status === 'pending' || appeal.status === 'under_review') && (
                      <div 
                        className="rounded-lg p-4 mt-4"
                        style={{ 
                          backgroundColor: appeal.status === 'pending' ? '#FFF3E0' : '#E3F2FD',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle 
                            className="w-5 h-5 flex-shrink-0 mt-0.5" 
                            style={{ color: appeal.status === 'pending' ? '#FFA726' : '#42A5F5' }}
                          />
                          <div>
                            <p className="text-sm md:text-base font-medium" style={{ 
                              color: appeal.status === 'pending' ? '#F57C00' : '#1976D2'
                            }}>
                              {appeal.status === 'pending' 
                                ? 'Your appeal is waiting for admin review' 
                                : 'Your appeal is currently being reviewed by an administrator'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              You will be notified once a decision is made
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
