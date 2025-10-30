'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Report {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  reportedBy: string;
  reporterName: string;
  reporterEmail: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, investigating: 0, resolved: 0, dismissed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, priorityFilter, searchQuery]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/product-reports?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);
        setStats(data.stats || { pending: 0, investigating: 0, resolved: 0, dismissed: 0 });
      } else {
        console.error('API returned success:false', data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReport = async (reportId: string, updates: any) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/product-reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reportId,
          ...updates
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchReports();
        setSelectedReport(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      scam: '⚠️ Scam / Fraudulent',
      fake_product: '🚫 Fake Product',
      misleading_info: '❌ Misleading Info',
      poor_quality: '👎 Poor Quality',
      counterfeit: '🔍 Counterfeit',
      other: '📝 Other'
    };
    return labels[reason] || reason;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins mb-2">Product Reports</h1>
          <p className="text-gray-600 font-poppins">Review and manage user-reported products</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 font-poppins">Pending</div>
            <div className="text-2xl font-bold text-gray-900 font-poppins">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 font-poppins">Investigating</div>
            <div className="text-2xl font-bold text-gray-900 font-poppins">{stats.investigating}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 font-poppins">Resolved</div>
            <div className="text-2xl font-bold text-gray-900 font-poppins">{stats.resolved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
            <div className="text-sm text-gray-600 font-poppins">Dismissed</div>
            <div className="text-2xl font-bold text-gray-900 font-poppins">{stats.dismissed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-poppins"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-poppins"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, sellers, reporters..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-poppins"
              />
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600 font-poppins">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600 font-poppins">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Reporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {report.productImage && (
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              <Image
                                src={report.productImage}
                                alt={report.productName}
                                fill
                                className="rounded object-cover"
                              />
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 font-poppins">{report.productName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-poppins">{report.reporterName}</div>
                        <div className="text-xs text-gray-500">{report.reporterEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-poppins">{report.sellerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-poppins">{getReasonLabel(report.reason)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(report.priority)} font-poppins`}>
                          {report.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)} font-poppins`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.adminNotes || '');
                          }}
                          className="text-green-600 hover:text-green-900 font-poppins"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-poppins">Report Details</h2>
                  <p className="text-sm text-white/90 mt-1 font-poppins">ID: {selectedReport._id}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-poppins">Product Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-poppins"><strong>Product:</strong> {selectedReport.productName}</p>
                  <p className="text-sm font-poppins mt-2"><strong>Seller:</strong> {selectedReport.sellerName}</p>
                </div>
              </div>

              {/* Report Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-poppins">Report Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-poppins"><strong>Reported By:</strong> {selectedReport.reporterName} ({selectedReport.reporterEmail})</p>
                  <p className="text-sm font-poppins"><strong>Reason:</strong> {getReasonLabel(selectedReport.reason)}</p>
                  <p className="text-sm font-poppins"><strong>Priority:</strong> <span className={`px-2 py-1 rounded ${getPriorityColor(selectedReport.priority)}`}>{selectedReport.priority.toUpperCase()}</span></p>
                  <p className="text-sm font-poppins"><strong>Status:</strong> <span className={`px-2 py-1 rounded ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></p>
                  <p className="text-sm font-poppins"><strong>Submitted:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-poppins">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-poppins whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-poppins">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this report..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-poppins text-sm resize-none"
                />
              </div>

              {/* Status Update */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-poppins">Update Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateReport(selectedReport._id, { status: 'investigating', adminNotes })}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-poppins disabled:opacity-50"
                  >
                    Start Investigation
                  </button>
                  <button
                    onClick={() => updateReport(selectedReport._id, { status: 'resolved', adminNotes })}
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-poppins disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => updateReport(selectedReport._id, { status: 'dismissed', adminNotes })}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-poppins disabled:opacity-50"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => updateReport(selectedReport._id, { adminNotes })}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-poppins disabled:opacity-50"
                  >
                    Save Notes Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
