'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuspensionBannerProps {
  reason?: string | null;
  suspendedAt?: Date | string | null;
  suspensionExpiresAt?: Date | string | null;
  className?: string;
}

export default function SuspensionBanner({ 
  reason, 
  suspendedAt, 
  suspensionExpiresAt,
  className = ''
}: SuspensionBannerProps) {
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkPendingAppeals();
  }, []);

  const checkPendingAppeals = async () => {
    try {
      const response = await fetch('/api/appeals');
      if (response.ok) {
        const data = await response.json();
        const pending = data.appeals?.some((appeal: any) => 
          appeal.status === 'pending' || appeal.status === 'under_review'
        );
        setHasPendingAppeal(pending);
      }
    } catch (error) {
      console.error('Error checking appeals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const expiryDate = formatDate(suspensionExpiresAt);
  const suspensionDate = formatDate(suspendedAt);

  return (
    <div 
      className={`bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-red-800 mb-1 font-poppins">
            Your account is suspended
          </h3>
          
          <div className="text-sm text-red-700 space-y-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <p className="font-medium">
              {reason || 'Your account has been suspended due to a violation of our terms of service.'}
            </p>
            
            {suspensionDate && (
              <p className="text-xs text-red-600">
                Suspended on: {suspensionDate}
              </p>
            )}
            
            {expiryDate ? (
              <p className="text-xs text-red-600">
                This suspension will be automatically lifted on <strong>{expiryDate}</strong>.
              </p>
            ) : (
              <p className="text-xs text-red-600">
                This suspension is indefinite and requires admin review.
              </p>
            )}
            
            <p className="mt-2">
              <strong>What this means:</strong> You can view your account and browse, but you cannot buy or sell products while suspended.
            </p>
            
            {!loading && (
              <p className="mt-1">
                <strong>What you can do:</strong> {hasPendingAppeal 
                  ? 'Your appeal is under review. Please wait for the admin decision.' 
                  : 'Submit an appeal to request early restoration of your account.'}
              </p>
            )}
          </div>
        </div>
        
        {/* CTA Button or Status */}
        <div className="flex-shrink-0">
          {!loading && (
            hasPendingAppeal ? (
              <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-3 text-center min-w-[130px]">
                <Clock className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Appeal Pending
                </p>
                <p className="text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif', marginTop: '2px' }}>
                  Under Review
                </p>
              </div>
            ) : (
              <Link href="/appeals/new">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white hover:bg-red-50 text-red-700 border-red-300 hover:border-red-400 whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Appeal
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
      
      {/* Additional help text */}
      <div className="mt-3 pl-9 text-xs text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <p>
          Need help? Contact us at{' '}
          <a 
            href="mailto:support@harvesthubph.app" 
            className="underline hover:text-red-800 font-medium"
          >
            support@harvesthubph.app
          </a>
        </p>
      </div>
    </div>
  );
}
