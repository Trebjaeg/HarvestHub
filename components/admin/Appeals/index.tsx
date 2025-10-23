'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDots from '@/components/ui/LoadingDots';

interface Appeal {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  appealType: 'account_suspension' | 'report_dispute' | 'verification_rejection' | 'other';
  subject: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminResponse?: string;
}

const Appeals: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appeals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appeals');
      }

      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      setError('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const updateAppealStatus = async (appealId: string, status: string, adminResponse?: string) => {
    try {
      const response = await fetch(`/api/admin/appeals/${appealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status, adminResponse })
      });

      if (!response.ok) {
        throw new Error('Failed to update appeal status');
      }

      fetchAppeals(); // Refresh the list
      setSelectedAppeal(null);
      setResponse('');
    } catch (error) {
      console.error('Error updating appeal status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'under_review':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Under Review</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getAppealTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'account_suspension': { label: 'Account Suspension', color: 'bg-red-100 text-red-800' },
      'report_dispute': { label: 'Report Dispute', color: 'bg-orange-100 text-orange-800' },
      'verification_rejection': { label: 'Verification Rejection', color: 'bg-purple-100 text-purple-800' },
      'other': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    };

    const typeInfo = typeMap[type] || typeMap['other'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600">Loading appeals</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchAppeals} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Appeals Management</h2>
        <Button onClick={fetchAppeals} variant="outline" className="w-full sm:w-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>Appeals ({appeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => (
                  <tr key={appeal._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{appeal.userName}</div>
                      <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{appeal.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getAppealTypeBadge(appeal.appealType)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {appeal.subject}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(appeal.status)}
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(appeal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedAppeal(appeal)}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          View
                        </Button>
                        {(appeal.status === 'pending' || appeal.status === 'under_review') && (
                          <>
                            <Button
                              onClick={() => updateAppealStatus(appeal._id, 'approved')}
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-600 hover:bg-green-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => updateAppealStatus(appeal._id, 'rejected')}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                {/* User Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>User</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{appeal.userName}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{appeal.userEmail}</div>
                </div>

                {/* Type and Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Type</div>
                    {getAppealTypeBadge(appeal.appealType)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</div>
                    {getStatusBadge(appeal.status)}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Subject</div>
                  <div className="font-medium text-gray-900 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {appeal.subject}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {new Date(appeal.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => setSelectedAppeal(appeal)}
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    View
                  </Button>
                  {(appeal.status === 'pending' || appeal.status === 'under_review') && (
                    <>
                      <Button
                        onClick={() => updateAppealStatus(appeal._id, 'approved')}
                        variant="outline"
                        size="sm"
                        className="w-full border-green-200 text-green-600 hover:bg-green-50"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateAppealStatus(appeal._id, 'rejected')}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {appeals.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>No appeals found</h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>There are no appeals to display.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Appeal Details</h3>
                <button
                  onClick={() => setSelectedAppeal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p className="text-gray-900">{selectedAppeal.userName} ({selectedAppeal.userEmail})</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  {getAppealTypeBadge(selectedAppeal.appealType)}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-gray-900">{selectedAppeal.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedAppeal.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedAppeal.status)}
                </div>
                
                {selectedAppeal.adminResponse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Response</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedAppeal.adminResponse}</p>
                  </div>
                )}
                
                {(selectedAppeal.status === 'pending' || selectedAppeal.status === 'under_review') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Response</label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      rows={4}
                      placeholder="Enter your response..."
                    />
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => updateAppealStatus(selectedAppeal._id, 'approved', response)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateAppealStatus(selectedAppeal._id, 'rejected', response)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => updateAppealStatus(selectedAppeal._id, 'under_review', response)}
                        variant="outline"
                      >
                        Under Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appeals;