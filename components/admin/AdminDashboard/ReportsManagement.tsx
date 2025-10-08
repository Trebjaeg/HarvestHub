'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { useReactiveTranslation } from '../../../hooks/useReactiveTranslation';

interface UserReport {
  _id: string;
  reportedUser: {
    _id: string;
    name: string;
    email: string;
    status: string;
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  reason: string;
  description: string;
  evidence: Array<{
    type: 'text' | 'image' | 'url';
    content: string;
    description?: string;
  }>;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
  actionTaken?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface ReportActionDialog {
  isOpen: boolean;
  action: 'start_review' | 'resolve' | 'dismiss' | null;
  report: UserReport | null;
  reviewNotes: string;
  actionTaken: string;
}

const ReportsManagement: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<ReportActionDialog>({
    isOpen: false,
    action: null,
    report: null,
    reviewNotes: '',
    actionTaken: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [currentPage, statusFilter, typeFilter, priorityFilter, searchTerm]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async () => {
    if (!actionDialog.report || !actionDialog.action) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: actionDialog.report._id,
          action: actionDialog.action,
          reviewNotes: actionDialog.reviewNotes,
          actionTaken: actionDialog.actionTaken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      await fetchReports();
      
      setActionDialog({
        isOpen: false,
        action: null,
        report: null,
        reviewNotes: '',
        actionTaken: ''
      });

    } catch (error) {
      console.error('Error performing report action:', error);
      setError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (action: ReportActionDialog['action'], report: UserReport) => {
    setActionDialog({
      isOpen: true,
      action,
      report,
      reviewNotes: '',
      actionTaken: ''
    });
  };

  const getStatusBadge = (status: UserReport['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Under Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: UserReport['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment',
      inappropriate_content: 'Inappropriate Content',
      fake_profile: 'Fake Profile',
      scam: 'Scam',
      copyright: 'Copyright Violation',
      other: 'Other'
    };
    return types[type] || type;
  };

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.reports.title', 'User Reports Management')}</CardTitle>
          <CardDescription>
            {t('admin.reports.description', 'Review and moderate user reports')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin.reports.searchPlaceholder', 'Search reports...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="fake_profile">Fake Profile</SelectItem>
                <SelectItem value="scam">Scam</SelectItem>
                <SelectItem value="copyright">Copyright</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report._id} className={`${report.priority === 'critical' ? 'border-red-300 bg-red-50' : report.priority === 'high' ? 'border-orange-300 bg-orange-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(report.status)}
                  {getPriorityBadge(report.priority)}
                  <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reported User</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{report.reportedUser.name}</p>
                    <p className="text-sm text-gray-600">{report.reportedUser.email}</p>
                    <p className="text-sm text-gray-500">Status: {report.reportedUser.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reported By</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{report.reportedBy.name}</p>
                    <p className="text-sm text-gray-600">{report.reportedBy.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Report Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-sm mb-2">Reason: {report.reason}</p>
                  <p className="text-sm text-gray-700">{report.description}</p>
                  
                  {report.evidence && report.evidence.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm mb-2">Evidence:</p>
                      <div className="space-y-2">
                        {report.evidence.map((evidence, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-sm">
                            <span className="font-medium capitalize">{evidence.type}:</span> {evidence.content}
                            {evidence.description && (
                              <p className="text-gray-600 mt-1">{evidence.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {report.reviewNotes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Review Notes</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm">{report.reviewNotes}</p>
                    {report.reviewedBy && (
                      <p className="text-xs text-gray-600 mt-2">
                        Reviewed by {report.reviewedBy.name} on {report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                {report.status === 'pending' && (
                  <Button
                    onClick={() => openActionDialog('start_review', report)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Start Review
                  </Button>
                )}
                
                {report.status === 'under_review' && (
                  <>
                    <Button
                      onClick={() => openActionDialog('resolve', report)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Resolve
                    </Button>
                    <Button
                      onClick={() => openActionDialog('dismiss', report)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, isOpen: false })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'start_review' && 'Start Report Review'}
              {actionDialog.action === 'resolve' && 'Resolve Report'}
              {actionDialog.action === 'dismiss' && 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'start_review' && 'Begin reviewing this user report.'}
              {actionDialog.action === 'resolve' && 'Mark this report as resolved and specify actions taken.'}
              {actionDialog.action === 'dismiss' && 'Dismiss this report as invalid or not actionable.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes *</Label>
              <Textarea
                id="reviewNotes"
                placeholder="Provide detailed notes about your review and decision..."
                value={actionDialog.reviewNotes}
                onChange={(e) => setActionDialog({ ...actionDialog, reviewNotes: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>

            {(actionDialog.action === 'resolve') && (
              <div>
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Select value={actionDialog.actionTaken} onValueChange={(value) => setActionDialog({ ...actionDialog, actionTaken: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select action taken" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_warned">User Warned</SelectItem>
                    <SelectItem value="user_suspended">User Suspended</SelectItem>
                    <SelectItem value="user_deleted">User Account Deleted</SelectItem>
                    <SelectItem value="content_removed">Content Removed</SelectItem>
                    <SelectItem value="no_action">No Action Required</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, isOpen: false })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportAction}
              disabled={actionLoading || !actionDialog.reviewNotes.trim()}
              className={`
                ${actionDialog.action === 'resolve' ? 'bg-green-600 hover:bg-green-700' : ''}
                ${actionDialog.action === 'dismiss' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                ${actionDialog.action === 'start_review' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              `}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;