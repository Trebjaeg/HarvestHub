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

interface FarmerDocument {
  filename: string;
  originalName: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
}

interface FarmerDetails {
  farmName?: string;
  farmAddress?: string;
  contactNumber?: string;
}

interface PendingFarmer {
  _id: string;
  name: string;
  email: string;
  sellerStatus: 'pending' | 'verified' | 'rejected';
  farmerVerification?: {
    governmentId?: FarmerDocument;
    farmDetails?: FarmerDetails;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
    notes?: string;
  };
  createdAt: string;
}

const FarmerVerification: React.FC = () => {
  const { t } = useReactiveTranslation();
  const [farmers, setFarmers] = useState<PendingFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<PendingFarmer | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/farmers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch farmers');
      }

      const data = await response.json();
      setFarmers(data.farmers || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const handleReview = async (farmerId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/farmers/${farmerId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          notes: adminNotes
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
      verified: "default",
      rejected: "destructive"
    };
    
    const colors: Record<string, string> = {
      pending: "text-yellow-600 border-yellow-600",
      verified: "text-green-600 border-green-600 bg-green-50",
      rejected: "text-red-600 border-red-600"
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
    return farmer.sellerStatus === filterStatus;
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
                    <CardTitle className="text-lg">{farmer.name}</CardTitle>
                    <CardDescription>{farmer.email}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(farmer.sellerStatus)}
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
                          <DialogTitle>Farmer Application Details</DialogTitle>
                          <DialogDescription>
                            Review {farmer.name}'s farmer verification application
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedFarmer && (
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold">Name</Label>
                                <p>{selectedFarmer.name}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Email</Label>
                                <p>{selectedFarmer.email}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedFarmer.sellerStatus)}</div>
                              </div>
                              <div>
                                <Label className="font-semibold">Applied On</Label>
                                <p>{selectedFarmer.farmerVerification?.submittedAt ? 
                                  new Date(selectedFarmer.farmerVerification.submittedAt).toLocaleDateString() : 
                                  'Not submitted'
                                }</p>
                              </div>
                            </div>

                            {/* Farm Details */}
                            {selectedFarmer.farmerVerification?.farmDetails && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Farm Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Farm Name</Label>
                                    <p>{selectedFarmer.farmerVerification.farmDetails.farmName || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Contact Number</Label>
                                    <p>{selectedFarmer.farmerVerification.farmDetails.contactNumber || 'Not provided'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label className="font-semibold">Farm Address</Label>
                                    <p>{selectedFarmer.farmerVerification.farmDetails.farmAddress || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Government ID Document */}
                            {selectedFarmer.farmerVerification?.governmentId && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Government ID</h3>
                                <div className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold">Government Identification</p>
                                      <p className="text-sm text-gray-600">{selectedFarmer.farmerVerification.governmentId.originalName}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(selectedFarmer.farmerVerification.governmentId.fileSize)} • {new Date(selectedFarmer.farmerVerification.governmentId.uploadedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(selectedFarmer.farmerVerification?.governmentId?.fileUrl, '_blank')}
                                    >
                                      View ID
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Review Actions */}
                            {selectedFarmer.sellerStatus === 'pending' && (
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
                            {selectedFarmer.sellerStatus !== 'pending' && (
                              <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                                <div className="space-y-2">
                                  <p><span className="font-semibold">Status:</span> {getStatusBadge(selectedFarmer.sellerStatus)}</p>
                                  {selectedFarmer.farmerVerification?.reviewedAt && (
                                    <p><span className="font-semibold">Reviewed On:</span> {new Date(selectedFarmer.farmerVerification.reviewedAt).toLocaleDateString()}</p>
                                  )}
                                  {selectedFarmer.farmerVerification?.rejectionReason && (
                                    <p><span className="font-semibold">Rejection Reason:</span> {selectedFarmer.farmerVerification.rejectionReason}</p>
                                  )}
                                  {selectedFarmer.farmerVerification?.notes && (
                                    <p><span className="font-semibold">Admin Notes:</span> {selectedFarmer.farmerVerification.notes}</p>
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
                    <p>{farmer.farmerVerification?.submittedAt ? 
                      new Date(farmer.farmerVerification.submittedAt).toLocaleDateString() : 
                      'Not submitted'
                    }</p>
                  </div>
                  <div>
                    <span className="font-semibold">Documents:</span>
                    <p>{farmer.farmerVerification?.governmentId ? '1 file' : '0 files'}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Farm:</span>
                    <p>{farmer.farmerVerification?.farmDetails?.farmName || 'Not provided'}</p>
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