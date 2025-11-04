'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
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
    status?: 'active' | 'suspended' | 'deleted';
    isActive?: boolean;
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

// Type alias to avoid empty interface warning
type PendingFarmer = SellerApplication;

const FarmerVerification: React.FC = () => {
  const [farmers, setFarmers] = useState<PendingFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<PendingFarmer | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to generate file URL from key
  const getFileUrl = (key: string) => {
    const cdnUrl = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL || 'https://barn.sgp1.cdn.digitaloceanspaces.com';
    return `${cdnUrl}/${key}`;
  };

  const fetchFarmers = useCallback(async () => {
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
  }, [filterStatus]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Auto-refresh when filter changes  
  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleReview = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      setReviewLoading(true);
      const response = await fetch(`/api/admin/verification/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action,
          reason: action === 'reject' ? rejectionReason : undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to review farmer');
      }

      await response.json(); // Consume the response
      
      // Show success message
      alert(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh the list
      await fetchFarmers();
      
      // Reset form
      setSelectedFarmer(null);
      setReviewAction(null);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error reviewing farmer:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to review farmer'}`);
    } finally {
      setReviewLoading(false);
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
      rejected: "text-black border-red-600 bg-red-50"
    };

    const displayStatus = status === 'approved' ? 'verified' : status;

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  const getAccountStatusBadge = (userStatus?: 'active' | 'suspended' | 'deleted', applicationStatus?: string) => {
    // For rejected applications, show a different message
    if (applicationStatus === 'rejected') {
      if (userStatus === 'suspended') {
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
            Account Suspended
          </Badge>
        );
      }
      if (userStatus === 'deleted') {
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
            Account Deactivated
          </Badge>
        );
      }
      // Don't show "Active" for rejected applications, just return null
      return null;
    }
    
    if (!userStatus || userStatus === 'active') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
          Active Account
        </Badge>
      );
    }
    
    if (userStatus === 'suspended') {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
          Account Suspended
        </Badge>
      );
    }
    
    if (userStatus === 'deleted') {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
          Account Deactivated
        </Badge>
      );
    }
    
    return null;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFarmers = farmers.filter(farmer => {
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'verified') {
      matchesStatus = farmer.status === 'approved';
    } else if (filterStatus !== 'all') {
      matchesStatus = farmer.status === filterStatus;
    }

    // Search filter
    const matchesSearch = searchTerm === '' ||
      (farmer.userId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (farmer.userId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Farmer Verification</h2>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Review and verify farmer applications</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'verified' | 'rejected') => setFilterStatus(value)}>
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

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{farmer.userId.name}</CardTitle>
                    <CardDescription style={{ fontFamily: 'Poppins, sans-serif' }}>{farmer.userId.email}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {getStatusBadge(farmer.status)}
                    {getAccountStatusBadge(farmer.userId.status, farmer.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedFarmer(farmer)}
                          className="w-full sm:w-auto"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <DialogHeader>
                          <DialogTitle style={{ fontFamily: 'Poppins, sans-serif' }}>Seller Verification Application</DialogTitle>
                          <DialogDescription style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Review seller verification application
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedFarmer && (
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Name</Label>
                                <p style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedFarmer.userId.name}</p>
                              </div>
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Email</Label>
                                <p style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedFarmer.userId.email}</p>
                              </div>
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Phone</Label>
                                <p style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedFarmer.userId.phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Account Status</Label>
                                <div className="mt-1">{getAccountStatusBadge(selectedFarmer.userId.status, selectedFarmer.status)}</div>
                              </div>
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Verification Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedFarmer.status)}</div>
                              </div>
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Applied On</Label>
                                <p style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(selectedFarmer.submittedAt).toLocaleString()}</p>
                              </div>
                              {selectedFarmer.reviewedAt && (
                                <div>
                                  <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Reviewed On</Label>
                                  <p style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(selectedFarmer.reviewedAt).toLocaleString()}</p>
                                </div>
                              )}
                            </div>

                            {/* Address */}
                            {selectedFarmer.userId.address && (
                              <div>
                                <Label className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Address</Label>
                                <p style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedFarmer.userId.address}</p>
                              </div>
                            )}

                            {/* Documents Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Submitted Documents</h3>
                              
                              {/* Government ID Front */}
                              <div className="border rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                  <div className="flex-1">
                                    <p className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Government ID (Front)</p>
                                    <p className="text-sm text-gray-600 break-all" style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedFarmer.governmentIdFrontOriginalName}</p>
                                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      {formatFileSize(selectedFarmer.governmentIdFrontSize)} • {selectedFarmer.governmentIdFrontMimeType}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(getFileUrl(selectedFarmer.governmentIdFrontKey), '_blank')}
                                    className="w-full sm:w-auto"
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
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
                                    {!reviewAction && (
                                      <>
                                        <Button
                                          onClick={() => setReviewAction('approve')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Approve Farmer
                                        </Button>
                                        <Button
                                          onClick={() => setReviewAction('reject')}
                                          variant="destructive"
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
                                          className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                                          disabled={reviewLoading || (reviewAction === 'reject' && !rejectionReason.trim())}
                                        >
                                          {reviewLoading ? (
                                            <>
                                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setReviewAction(null);
                                            setRejectionReason('');
                                          }}
                                          variant="outline"
                                          disabled={reviewLoading}
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
                                <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                                <div className="space-y-2">
                                  <div><span className="font-semibold">Status:</span> {getStatusBadge(selectedFarmer.status)}</div>
                                  {selectedFarmer.reviewedAt && (
                                    <div><span className="font-semibold">Reviewed On:</span> {new Date(selectedFarmer.reviewedAt).toLocaleString()}</div>
                                  )}
                                  {selectedFarmer.reviewedBy && (
                                    <div><span className="font-semibold">Reviewed By:</span> {selectedFarmer.reviewedBy.name} ({selectedFarmer.reviewedBy.email})</div>
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