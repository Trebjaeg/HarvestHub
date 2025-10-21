'use client';

import React, { useState, useEffect } from 'react';
import { useReactiveTranslation } from '../../../hooks/useReactiveTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import LoadingDots from '../../ui/LoadingDots';

interface SellerApplication {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    createdAt: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  governmentIdFrontKey: string;
  governmentIdFrontOriginalName: string;
  governmentIdFrontSize: number;
  governmentIdFrontMimeType: string;
  governmentIdBackKey: string;
  governmentIdBackOriginalName: string;
  governmentIdBackSize: number;
  governmentIdBackMimeType: string;
  birDocumentKey: string;
  birDocumentOriginalName: string;
  birDocumentSize: number;
  birDocumentMimeType: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  adminNotes?: string;
}

interface PendingFarmer extends SellerApplication {}

const FarmerVerification: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [farmers, setFarmers] = useState<PendingFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<PendingFarmer | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

  // Helper function to generate file URL from key
  const getFileUrl = (key: string) => {
    const cdnUrl = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL || 'https://barn.sgp1.cdn.digitaloceanspaces.com';
    return `${cdnUrl}/${key}`;
  };

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const statusQuery = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/admin/verification/applications${statusQuery}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setFarmers(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

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
      await fetchFarmers();
      
      // Reset form
      setSelectedFarmer(null);
      setReviewAction(null);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error reviewing farmer:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      verified: "default",
      rejected: "destructive"
    };
    
    const colors: Record<string, string> = {
      pending: "text-yellow-600 border-yellow-600",
      approved: "text-green-600 border-green-600 bg-green-50",
      verified: "text-green-600 border-green-600 bg-green-50",
      rejected: "text-red-600 border-red-600"
    };

    const displayStatus = status === 'approved' ? 'verified' : status;

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFarmers = farmers.filter(farmer => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return farmer.status === 'approved';
    return farmer.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#16a34a" />
          </div>
          <p className="text-gray-600">Loading farmers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Farmer Verification</h2>
          <p className="text-gray-600">Review and verify farmer applications</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farmers</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchFarmers} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {filteredFarmers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No farmers found for the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{farmer.userId.name}</CardTitle>
                    <CardDescription>{farmer.userId.email}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(farmer.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedFarmer(farmer)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Seller Verification Application</DialogTitle>
                          <DialogDescription>
                            Review seller verification application
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedFarmer && (
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold">Name</Label>
                                <p>{selectedFarmer.userId.name}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Email</Label>
                                <p>{selectedFarmer.userId.email}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Phone</Label>
                                <p>{selectedFarmer.userId.phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedFarmer.status)}</div>
                              </div>
                              <div>
                                <Label className="font-semibold">Applied On</Label>
                                <p>{new Date(selectedFarmer.submittedAt).toLocaleString()}</p>
                              </div>
                              {selectedFarmer.reviewedAt && (
                                <div>
                                  <Label className="font-semibold">Reviewed On</Label>
                                  <p>{new Date(selectedFarmer.reviewedAt).toLocaleString()}</p>
                                </div>
                              )}
                            </div>

                            {/* Address */}
                            {selectedFarmer.userId.address && (
                              <div>
                                <Label className="font-semibold">Address</Label>
                                <p>{selectedFarmer.userId.address}</p>
                              </div>
                            )}

                            {/* Documents Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Submitted Documents</h3>
                              
                              {/* Government ID Front */}
                              <div className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">Government ID (Front)</p>
                                    <p className="text-sm text-gray-600">{selectedFarmer.governmentIdFrontOriginalName}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(selectedFarmer.governmentIdFrontSize)} • {selectedFarmer.governmentIdFrontMimeType}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(getFileUrl(selectedFarmer.governmentIdFrontKey), '_blank')}
                                  >
                                    View Document
                                  </Button>
                                </div>
                              </div>

                              {/* Government ID Back */}
                              <div className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">Government ID (Back)</p>
                                    <p className="text-sm text-gray-600">{selectedFarmer.governmentIdBackOriginalName}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(selectedFarmer.governmentIdBackSize)} • {selectedFarmer.governmentIdBackMimeType}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(getFileUrl(selectedFarmer.governmentIdBackKey), '_blank')}
                                  >
                                    View Document
                                  </Button>
                                </div>
                              </div>

                              {/* BIR Document */}
                              <div className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">BIR Certificate</p>
                                    <p className="text-sm text-gray-600">{selectedFarmer.birDocumentOriginalName}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(selectedFarmer.birDocumentSize)} • {selectedFarmer.birDocumentMimeType}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(getFileUrl(selectedFarmer.birDocumentKey), '_blank')}
                                  >
                                    View Document
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Review Notes */}
                            {selectedFarmer.adminNotes && (
                              <div>
                                <Label className="font-semibold">Admin Notes</Label>
                                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedFarmer.adminNotes}</p>
                              </div>
                            )}

                            {/* Rejection Reason */}
                            {selectedFarmer.rejectionReason && (
                              <div>
                                <Label className="font-semibold text-red-600">Rejection Reason</Label>
                                <p className="text-sm mt-1 p-3 bg-red-50 rounded text-red-900">{selectedFarmer.rejectionReason}</p>
                              </div>
                            )}

                            {/* Review Actions */}
                            {selectedFarmer.status === 'pending' && (
                              <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-3">Review Application</h3>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                    <Textarea
                                      id="adminNotes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add any notes about this application..."
                                      className="mt-1"
                                    />
                                  </div>

                                  {reviewAction === 'reject' && (
                                    <div>
                                      <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                                      <Textarea
                                        id="rejectionReason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this application is being rejected..."
                                        className="mt-1"
                                        required
                                      />
                                    </div>
                                  )}

                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => setReviewAction('approve')}
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={reviewAction === 'approve'}
                                    >
                                      {reviewAction === 'approve' ? 'Approving...' : 'Approve Farmer'}
                                    </Button>
                                    <Button
                                      onClick={() => setReviewAction('reject')}
                                      variant="destructive"
                                      disabled={reviewAction === 'reject'}
                                    >
                                      Reject Application
                                    </Button>
                                    {reviewAction && (
                                      <Button
                                        onClick={() => {
                                          if (reviewAction === 'reject' && !rejectionReason.trim()) {
                                            alert('Please provide a rejection reason');
                                            return;
                                          }
                                          handleReview(selectedFarmer._id, reviewAction);
                                        }}
                                        variant="outline"
                                      >
                                        Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Previous Review Info */}
                            {selectedFarmer.status !== 'pending' && (
                              <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                                <div className="space-y-2">
                                  <p><span className="font-semibold">Status:</span> {getStatusBadge(selectedFarmer.status)}</p>
                                  {selectedFarmer.reviewedAt && (
                                    <p><span className="font-semibold">Reviewed On:</span> {new Date(selectedFarmer.reviewedAt).toLocaleString()}</p>
                                  )}
                                  {selectedFarmer.reviewedBy && (
                                    <p><span className="font-semibold">Reviewed By:</span> {selectedFarmer.reviewedBy.name} ({selectedFarmer.reviewedBy.email})</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Applied:</span>
                    <p>{new Date(farmer.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Documents:</span>
                    <p>3 files (ID Front, ID Back, BIR)</p>
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>
                    <p>{farmer.userId.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerVerification;