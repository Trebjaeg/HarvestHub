'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VerificationRequest {
  _id: string;
  farmerId: string;
  farmerName: string;
  email: string;
  farmName: string;
  location: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  userId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
  };
  governmentIdFrontOriginalName?: string;
  governmentIdFrontSize?: number;
  governmentIdFrontMimeType?: string;
  governmentIdFrontKey?: string;
  governmentIdBackOriginalName?: string;
  governmentIdBackSize?: number;
  governmentIdBackMimeType?: string;
  governmentIdBackKey?: string;
  birDocumentOriginalName?: string;
  birDocumentSize?: number;
  birDocumentMimeType?: string;
  birDocumentKey?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

const FarmerVerification: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedFarmer, setSelectedFarmer] = useState<VerificationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  // Auto-refresh when filter changes
  useEffect(() => {
    fetchVerificationRequests();
  }, [filterStatus]);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Mock data for now
      setRequests([
        {
          _id: '1',
          farmerId: 'farmer1',
          farmerName: 'John Smith',
          email: 'farmer@example.com',
          farmName: 'Green Valley Farm',
          location: 'California',
          documents: ['license.pdf', 'certificate.pdf'],
          status: 'pending',
          submittedAt: new Date().toISOString(),
          userId: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'farmer@example.com',
            address: '123 Farm Road, California'
          },
          governmentIdFrontOriginalName: 'id_front.jpg',
          governmentIdFrontSize: 1024000,
          governmentIdFrontMimeType: 'image/jpeg',
          governmentIdFrontKey: 'uploads/id_front.jpg',
          governmentIdBackOriginalName: 'id_back.jpg',
          governmentIdBackSize: 1024000,
          governmentIdBackMimeType: 'image/jpeg',
          governmentIdBackKey: 'uploads/id_back.jpg',
          birDocumentOriginalName: 'bir_cert.pdf',
          birDocumentSize: 2048000,
          birDocumentMimeType: 'application/pdf',
          birDocumentKey: 'uploads/bir_cert.pdf'
        }
      ]);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      setError('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/verification/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          adminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to review farmer');
      }

      // Refresh the list
      await fetchVerificationRequests();
      
      // Reset form
      setSelectedFarmer(null);
      setReviewAction(null);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error reviewing farmer:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    // TODO: Implement approval logic
    console.log('Approving request:', requestId);
  };

  const handleReject = async (requestId: string) => {
    // TODO: Implement rejection logic
    console.log('Rejecting request:', requestId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileUrl = (key: string) => {
    // TODO: Implement proper file URL generation
    return `/api/files/${key}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return request.status === 'approved';
    return request.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingDots size="lg" color="#16a34a" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Farmer Verification
          </h2>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Review and verify farmer applications
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-40" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent style={{ fontFamily: 'Poppins, sans-serif' }}>
              <SelectItem value="all">All Farmers</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {request.farmerName}
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {request.email}
                    </p>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Farm: {request.farmName}
                    </p>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Location: {request.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFarmer(request)}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Documents:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {request.documents.map((doc, index) => (
                      <Button key={index} size="sm" variant="outline">
                        📄 {doc}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request._id)}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleReject(request._id)}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Request More Info
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  No verification requests found for the selected filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review Dialog */}
      <Dialog open={!!selectedFarmer} onOpenChange={() => setSelectedFarmer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Poppins, sans-serif' }}>
              Farmer Verification Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedFarmer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Farmer Name
                  </Label>
                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.farmerName}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Email
                  </Label>
                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.email}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Farm Name
                  </Label>
                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.farmName}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Location
                  </Label>
                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.location}
                  </p>
                </div>
              </div>

              {/* Address */}
              {selectedFarmer.userId?.address && (
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Address
                  </Label>
                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.userId.address}
                  </p>
                </div>
              )}

              {/* Documents Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Submitted Documents
                </h3>
                
                {/* Government ID Front */}
                {selectedFarmer.governmentIdFrontOriginalName && (
                  <div className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Government ID (Front)
                        </p>
                        <p className="text-sm text-gray-600 break-all" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {selectedFarmer.governmentIdFrontOriginalName}
                        </p>
                        {selectedFarmer.governmentIdFrontSize && (
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {formatFileSize(selectedFarmer.governmentIdFrontSize)} • {selectedFarmer.governmentIdFrontMimeType}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectedFarmer.governmentIdFrontKey && window.open(getFileUrl(selectedFarmer.governmentIdFrontKey), '_blank')}
                        className="w-full sm:w-auto"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>
                )}

                {/* Government ID Back */}
                {selectedFarmer.governmentIdBackOriginalName && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Government ID (Back)
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {selectedFarmer.governmentIdBackOriginalName}
                        </p>
                        {selectedFarmer.governmentIdBackSize && (
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {formatFileSize(selectedFarmer.governmentIdBackSize)} • {selectedFarmer.governmentIdBackMimeType}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectedFarmer.governmentIdBackKey && window.open(getFileUrl(selectedFarmer.governmentIdBackKey), '_blank')}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>
                )}

                {/* BIR Document */}
                {selectedFarmer.birDocumentOriginalName && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          BIR Certificate
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {selectedFarmer.birDocumentOriginalName}
                        </p>
                        {selectedFarmer.birDocumentSize && (
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {formatFileSize(selectedFarmer.birDocumentSize)} • {selectedFarmer.birDocumentMimeType}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectedFarmer.birDocumentKey && window.open(getFileUrl(selectedFarmer.birDocumentKey), '_blank')}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Notes */}
              {selectedFarmer.adminNotes && (
                <div>
                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Admin Notes
                  </Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.adminNotes}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedFarmer.rejectionReason && (
                <div>
                  <Label className="font-semibold text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Rejection Reason
                  </Label>
                  <p className="text-sm mt-1 p-3 bg-red-50 rounded text-red-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {selectedFarmer.rejectionReason}
                  </p>
                </div>
              )}

              {/* Review Actions */}
              {selectedFarmer.status === 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Review Application
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="adminNotes" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Admin Notes (Optional)
                      </Label>
                      <Textarea
                        id="adminNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add any notes about this application..."
                        className="mt-1"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      />
                    </div>

                    {reviewAction === 'reject' && (
                      <div>
                        <Label htmlFor="rejectionReason" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Rejection Reason *
                        </Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this application is being rejected..."
                          className="mt-1"
                          required
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap">
                      {!reviewAction && (
                        <>
                          <Button
                            onClick={() => setReviewAction('approve')}
                            className="bg-green-600 hover:bg-green-700"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Approve Farmer
                          </Button>
                          <Button
                            onClick={() => setReviewAction('reject')}
                            variant="destructive"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Reject Application
                          </Button>
                        </>
                      )}
                      {reviewAction && (
                        <>
                          <Button
                            onClick={() => {
                              if (reviewAction === 'reject' && !rejectionReason.trim()) {
                                alert('Please provide a rejection reason');
                                return;
                              }
                              handleReview(selectedFarmer._id, reviewAction);
                            }}
                            className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                            variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                          </Button>
                          <Button
                            onClick={() => {
                              setReviewAction(null);
                              setRejectionReason('');
                            }}
                            variant="outline"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Review Info */}
              {selectedFarmer.status !== 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Review Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Status:</span> {getStatusBadge(selectedFarmer.status)}
                    </div>
                    {selectedFarmer.reviewedAt && (
                      <div>
                        <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Reviewed On:</span> {new Date(selectedFarmer.reviewedAt).toLocaleString()}
                      </div>
                    )}
                    {selectedFarmer.reviewedBy && (
                      <div>
                        <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Reviewed By:</span> {selectedFarmer.reviewedBy}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmerVerification;