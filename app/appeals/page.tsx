'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LoadingDots from '@/components/ui/LoadingDots';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface Appeal {
  _id: string;
  type: string;
  reason: string;
  originalAction: string;
  originalReason: string;
  originalDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  priority: string;
  decision?: string | null;
  decisionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AppealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/appeals');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appeals');
      }

      setAppeals(data.appeals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load appeals');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-green-600" />;
      case 'under_review':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-green-50 text-green-800 border-green-300',
      under_review: 'bg-blue-50 text-blue-800 border-blue-300',
      approved: 'bg-green-100 text-green-800 border-green-400',
      rejected: 'bg-red-50 text-red-800 border-red-300'
    };

    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border font-poppins ${styles[status as keyof typeof styles]}`}>
        {getStatusIcon(status)}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="md" color="#40613D" />
          </div>
          <p className="text-gray-600 font-poppins">Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/my-profile')}
          variant="ghost"
          className="mb-4 font-poppins hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-[#40613D]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800 font-poppins">
                  My Appeals
                </h1>
                <p className="text-gray-600 text-sm mt-1 font-poppins">
                  View and manage your account suspension appeals
                </p>
              </div>
            </div>
            {user?.status === 'suspended' && (
              <Button
                onClick={() => router.push('/appeals/new')}
                className="bg-[#40613D] hover:bg-[#355230] font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appeal
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800 font-semibold font-poppins">{error}</p>
            </div>
          </div>
        )}

        {/* Appeals List */}
        {appeals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2 font-poppins">No Appeals Yet</h3>
            <p className="text-gray-500 mb-6 font-poppins">
              {user?.status === 'suspended' 
                ? "You haven't submitted any appeals yet. Submit an appeal to request account restoration." 
                : "You don't have any appeals on record."}
            </p>
            {user?.status === 'suspended' && (
              <Button
                onClick={() => router.push('/appeals/new')}
                className="bg-[#40613D] hover:bg-[#355230] font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Your First Appeal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 font-poppins">
                        {appeal.type === 'suspension' ? 'Account Suspension Appeal' : 'Account Deletion Appeal'}
                      </h3>
                      {getStatusBadge(appeal.status)}
                    </div>
                    <p className="text-sm text-gray-500 font-poppins">
                      Submitted on {new Date(appeal.createdAt).toLocaleDateString('en-US', {
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
                <div className="bg-gray-50 rounded-lg p-4 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Action:</h4>
                  <p className="text-sm text-gray-800 font-semibold">{appeal.originalAction}</p>
                  <p className="text-sm text-gray-600 mt-1">{appeal.originalReason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Action date: {new Date(appeal.originalDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Appeal Reason */}
                <div className="mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Explanation:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{appeal.reason}</p>
                </div>

                {/* Decision (if reviewed) */}
                {appeal.reviewedAt && (
                  <div className={`rounded-lg p-4 font-poppins ${
                    appeal.decision === 'approved' ? 'bg-green-50 border border-green-200' : 
                    appeal.decision === 'rejected' ? 'bg-red-50 border border-red-200' : 
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {appeal.decision === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : appeal.decision === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      )}
                      <h4 className="text-sm font-semibold">
                        {appeal.decision === 'approved' ? 'Appeal Approved' :
                         appeal.decision === 'rejected' ? 'Appeal Rejected' :
                         'Decision'}
                      </h4>
                    </div>
                    {appeal.decisionReason && (
                      <p className="text-sm mb-2">{appeal.decisionReason}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      Reviewed by {appeal.reviewedBy?.name || 'Admin'} on{' '}
                      {new Date(appeal.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Pending status message */}
                {appeal.status === 'pending' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 font-poppins">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">
                        Your appeal is pending review. We typically respond within 24-48 hours.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
