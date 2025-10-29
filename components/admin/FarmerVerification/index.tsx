'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@/components/ui/LoadingDots';

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
}

const FarmerVerification: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

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
          submittedAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      setError('Failed to load verification requests');
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Farmer Verification
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verification Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{request.farmerName}</h3>
                    <p className="text-gray-600">{request.email}</p>
                    <p className="text-sm text-gray-500">Farm: {request.farmName}</p>
                    <p className="text-sm text-gray-500">Location: {request.location}</p>
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'approved' ? 'default' : 'destructive'
                  }>
                    {request.status}
                  </Badge>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Documents:</h4>
                  <div className="flex gap-2">
                    {request.documents.map((doc, index) => (
                      <Button key={index} size="sm" variant="outline">
                        📄 {doc}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request._id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleReject(request._id)}
                    >
                      Reject
                    </Button>
                    <Button size="sm" variant="outline">
                      Request More Info
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerVerification;