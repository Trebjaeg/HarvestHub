'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

interface Appeal {
  _id: string;
  type: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  decision?: string;
  decisionReason?: string;
  reviewNotes?: string;
  reviewedBy?: {
    name: string;
    email: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

export default function AppealStatusCard() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/appeals', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Get most recent appeal
        setAppeals(data.appeals || []);
      }
    } catch (err) {
      console.error('Error fetching appeals:', err);
      setError('Failed to load appeal status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: <Clock className="h-5 w-5" />,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        title: 'Appeal Pending',
        description: 'Your appeal is waiting to be reviewed by our team.'
      },
      under_review: {
        icon: <Eye className="h-5 w-5" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        title: 'Under Review',
        description: 'Our team is currently reviewing your appeal and evidence.'
      },
      approved: {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        title: 'Appeal Approved',
        description: 'Great news! Your appeal has been approved and your account has been restored.'
      },
      rejected: {
        icon: <XCircle className="h-5 w-5" />,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        title: 'Appeal Rejected',
        description: 'Unfortunately, your appeal was not approved.'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (error || appeals.length === 0) {
    return null; // Don't show anything if no appeals
  }

  // Show only the most recent appeal
  const latestAppeal = appeals[0];
  const config = getStatusConfig(latestAppeal.status);

  return (
    <Card className={`${config.bgColor} border-2 ${config.borderColor} p-6 mb-6 shadow-md`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.color}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-bold ${config.color}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
              {config.title}
            </h3>
            <Badge className={config.badge} style={{ fontFamily: 'Poppins, sans-serif' }}>
              {latestAppeal.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <p className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {config.description}
          </p>

          {/* Appeal Details */}
          <div className="space-y-2 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <p className="text-gray-600">
              <strong>Submitted:</strong> {formatDate(latestAppeal.createdAt)}
            </p>

            {latestAppeal.reviewedAt && (
              <p className="text-gray-600">
                <strong>Reviewed:</strong> {formatDate(latestAppeal.reviewedAt)}
              </p>
            )}

            {latestAppeal.reviewedBy && (
              <p className="text-gray-600">
                <strong>Reviewed by:</strong> {latestAppeal.reviewedBy.name}
              </p>
            )}

            {/* Admin Decision */}
            {latestAppeal.status === 'approved' && latestAppeal.decisionReason && (
              <div className="mt-3 p-3 bg-white border border-green-200 rounded-lg">
                <p className="font-semibold text-green-800 mb-1">Admin Decision:</p>
                <p className="text-sm text-green-700">{latestAppeal.decisionReason}</p>
              </div>
            )}

            {latestAppeal.status === 'rejected' && latestAppeal.decisionReason && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800 mb-1">Reason for Rejection:</p>
                <p className="text-sm text-red-700">{latestAppeal.decisionReason}</p>
                {latestAppeal.reviewNotes && (
                  <>
                    <p className="font-semibold text-red-800 mt-2 mb-1">Additional Notes:</p>
                    <p className="text-sm text-red-700">{latestAppeal.reviewNotes}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <Link href="/appeals">
              <Button 
                variant="outline" 
                size="sm"
                className={`border-2 ${config.borderColor} hover:bg-white`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Appeals
              </Button>
            </Link>

            {latestAppeal.status === 'rejected' && (
              <Link href="/appeals/new">
                <Button 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Submit New Appeal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
