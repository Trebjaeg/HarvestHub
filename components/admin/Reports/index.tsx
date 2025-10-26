'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDots from '@/components/ui/LoadingDots';

interface Report {
  _id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  targetType: 'user' | 'farmer' | 'product';
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  // Auto-refresh when filter changes
  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'under_review':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Under Review</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Resolved</span>;
      case 'dismissed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Dismissed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600">Loading reports</p>
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
            <Button onClick={fetchReports} className="mt-4" variant="outline">
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
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Reporter</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Target</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Reason</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reporterName}</div>
                      <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reporterEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.targetName}</div>
                      <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Type: {report.targetType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reason}</div>
                      {report.description && (
                        <div className="text-sm text-gray-600 max-w-xs truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {report.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => updateReportStatus(report._id, 'under_review')}
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Review
                            </Button>
                            <Button
                              onClick={() => updateReportStatus(report._id, 'dismissed')}
                              variant="outline"
                              size="sm"
                              className="border-gray-200 text-gray-600 hover:bg-gray-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                        {report.status === 'under_review' && (
                          <>
                            <Button
                              onClick={() => updateReportStatus(report._id, 'resolved')}
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-600 hover:bg-green-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Resolve
                            </Button>
                            <Button
                              onClick={() => updateReportStatus(report._id, 'dismissed')}
                              variant="outline"
                              size="sm"
                              className="border-gray-200 text-gray-600 hover:bg-gray-50"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              Dismiss
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
            {filteredReports.map((report) => (
              <div key={report._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                {/* Reporter Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reporter</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reporterName}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reporterEmail}</div>
                </div>

                {/* Target Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Target</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.targetName}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Type: {report.targetType}</div>
                </div>

                {/* Reason */}
                <div>
                  <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reason</div>
                  <div className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{report.reason}</div>
                  {report.description && (
                    <div className="text-sm text-gray-600 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {report.description}
                    </div>
                  )}
                </div>

                {/* Status and Date */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Status</div>
                    {getStatusBadge(report.status)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Date</div>
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {(report.status === 'pending' || report.status === 'under_review') && (
                  <div className="flex flex-col gap-2 pt-2">
                    {report.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateReportStatus(report._id, 'under_review')}
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Review
                        </Button>
                        <Button
                          onClick={() => updateReportStatus(report._id, 'dismissed')}
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                    {report.status === 'under_review' && (
                      <>
                        <Button
                          onClick={() => updateReportStatus(report._id, 'resolved')}
                          variant="outline"
                          size="sm"
                          className="w-full border-green-200 text-green-600 hover:bg-green-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Resolve
                        </Button>
                        <Button
                          onClick={() => updateReportStatus(report._id, 'dismissed')}
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>No reports found</h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>There are no reports to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;