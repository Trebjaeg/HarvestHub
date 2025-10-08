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

interface Appeal {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    status: string;
  };
  type: string;
  reason: string;
  originalAction: string;
  originalReason: string;
  originalDate: string;
  originalActionBy?: string;
  evidence: Array<{
    type: 'text' | 'image' | 'url';
    content: string;
    description?: string;
  }>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
  decision?: 'approved' | 'rejected';
  decisionReason?: string;
  actionTaken?: string;
  createdAt: string;
  reviewedAt?: string;
  timeline: Array<{
    action: string;
    performedBy: string;
    date: string;
    notes?: string;
  }>;
}

interface AppealActionDialog {
  isOpen: boolean;
  action: 'start_review' | 'approve' | 'reject' | null;
  appeal: Appeal | null;
  reviewNotes: string;
  decisionReason: string;
  actionTaken: string;
}

const AppealsManagement: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<AppealActionDialog>({
    isOpen: false,
    action: null,
    appeal: null,
    reviewNotes: '',
    decisionReason: '',
    actionTaken: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppeals();
  }, [currentPage, statusFilter, typeFilter, priorityFilter, searchTerm]);

  const fetchAppeals = async () => {
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

      const response = await fetch(`/api/admin/appeals?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appeals');
      }

      const data = await response.json();
      setAppeals(data.appeals);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      setError('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealAction = async () => {
    if (!actionDialog.appeal || !actionDialog.action) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appealId: actionDialog.appeal._id,
          action: actionDialog.action,
          reviewNotes: actionDialog.reviewNotes,
          decisionReason: actionDialog.decisionReason,
          actionTaken: actionDialog.actionTaken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      await fetchAppeals();
      
      setActionDialog({
        isOpen: false,
        action: null,
        appeal: null,
        reviewNotes: '',
        decisionReason: '',
        actionTaken: ''
      });

    } catch (error) {
      console.error('Error performing appeal action:', error);
      setError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (action: AppealActionDialog['action'], appeal: Appeal) => {
    setActionDialog({
      isOpen: true,
      action,
      appeal,
      reviewNotes: '',
      decisionReason: '',
      actionTaken: ''
    });
  };

  const getStatusBadge = (status: Appeal['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Appeal['priority']) => {
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
      account_suspension: 'Account Suspension',
      account_deletion: 'Account Deletion',
      content_removal: 'Content Removal',
      warning_issued: 'Warning Issued',
      other: 'Other'
    };
    return types[type] || type;
  };

  if (loading && appeals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
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
          <CardTitle>{t('admin.appeals.title', 'Appeals Management')}</CardTitle>
          <CardDescription>
            {t('admin.appeals.description', 'Review and process user appeals')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin.appeals.searchPlaceholder', 'Search appeals...')}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="account_suspension">Account Suspension</SelectItem>
                <SelectItem value="account_deletion">Account Deletion</SelectItem>
                <SelectItem value="content_removal">Content Removal</SelectItem>
                <SelectItem value="warning_issued">Warning Issued</SelectItem>
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

      {/* Appeals List */}
      <div className="space-y-4">
        {appeals.map((appeal) => (
          <Card key={appeal._id} className={`${appeal.priority === 'critical' ? 'border-red-300 bg-red-50' : appeal.priority === 'high' ? 'border-orange-300 bg-orange-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(appeal.status)}
                  {getPriorityBadge(appeal.priority)}
                  <Badge variant="outline">{getTypeLabel(appeal.type)}</Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(appeal.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Appellant</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{appeal.user.name}</p>
                    <p className="text-sm text-gray-600">{appeal.user.email}</p>
                    <p className="text-sm text-gray-500">Status: {appeal.user.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Original Action</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-sm">{appeal.originalAction}</p>
                    <p className="text-sm text-gray-600 mt-1">{appeal.originalReason}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(appeal.originalDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Appeal Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{appeal.reason}</p>
                  
                  {appeal.evidence && appeal.evidence.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm mb-2">Evidence:</p>
                      <div className="space-y-2">
                        {appeal.evidence.map((evidence, index) => (
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

              {appeal.reviewNotes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Review Notes</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm">{appeal.reviewNotes}</p>
                    {appeal.reviewedBy && (
                      <p className="text-xs text-gray-600 mt-2">
                        Reviewed by {appeal.reviewedBy.name} on {appeal.reviewedAt ? new Date(appeal.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {appeal.decision && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Decision</h4>
                  <div className={`p-3 rounded-lg ${appeal.decision === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="font-medium text-sm capitalize">{appeal.decision}</p>
                    {appeal.decisionReason && (
                      <p className="text-sm mt-1">{appeal.decisionReason}</p>
                    )}
                    {appeal.actionTaken && (
                      <p className="text-sm text-gray-600 mt-1">Action taken: {appeal.actionTaken}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                {appeal.status === 'pending' && (
                  <Button
                    onClick={() => openActionDialog('start_review', appeal)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Start Review
                  </Button>
                )}
                
                {appeal.status === 'under_review' && (
                  <>
                    <Button
                      onClick={() => openActionDialog('approve', appeal)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => openActionDialog('reject', appeal)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject
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
      <Dialog open={actionDialog.isOpen} onOpenChange={(open: boolean) => !open && setActionDialog({ ...actionDialog, isOpen: false })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'start_review' && 'Start Appeal Review'}
              {actionDialog.action === 'approve' && 'Approve Appeal'}
              {actionDialog.action === 'reject' && 'Reject Appeal'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'start_review' && 'Begin reviewing this user appeal.'}
              {actionDialog.action === 'approve' && 'Approve this appeal and specify the corrective action.'}
              {actionDialog.action === 'reject' && 'Reject this appeal with a detailed explanation.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes *</Label>
              <Textarea
                id="reviewNotes"
                placeholder="Provide detailed notes about your review..."
                value={actionDialog.reviewNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionDialog({ ...actionDialog, reviewNotes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            {(actionDialog.action === 'approve' || actionDialog.action === 'reject') && (
              <div>
                <Label htmlFor="decisionReason">Decision Reason *</Label>
                <Textarea
                  id="decisionReason"
                  placeholder="Explain your decision..."
                  value={actionDialog.decisionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionDialog({ ...actionDialog, decisionReason: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}

            {actionDialog.action === 'approve' && (
              <div>
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Select value={actionDialog.actionTaken} onValueChange={(value: string) => setActionDialog({ ...actionDialog, actionTaken: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select action taken" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unsuspend">Unsuspend Account</SelectItem>
                    <SelectItem value="restore_content">Restore Content</SelectItem>
                    <SelectItem value="remove_warning">Remove Warning</SelectItem>
                    <SelectItem value="partial_restore">Partial Restoration</SelectItem>
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
              onClick={handleAppealAction}
              disabled={actionLoading || !actionDialog.reviewNotes.trim() || ((actionDialog.action === 'approve' || actionDialog.action === 'reject') && !actionDialog.decisionReason.trim())}
              className={`
                ${actionDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                ${actionDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
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

export default AppealsManagement;