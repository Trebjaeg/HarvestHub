"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLanding from "../modules/auth";

function AuthPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only redirect if user is already authenticated and we're done loading
    if (isAuthenticated && !isLoading) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Always show the auth form - no loading screens
  return <AuthLanding />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 120 30" className="w-12 h-8" role="img" aria-label="loading" xmlns="http://www.w3.org/2000/svg">
            <circle cx={30} cy={15} r={8} fill="#103C2E">
              <animate attributeName="cy" dur="0.8s" begin="0s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
              <animate attributeName="opacity" dur="0.8s" begin="0s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
            </circle>
            <circle cx={60} cy={15} r={8} fill="#103C2E">
              <animate attributeName="cy" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
              <animate attributeName="opacity" dur="0.8s" begin="0.15s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
            </circle>
            <circle cx={90} cy={15} r={8} fill="#103C2E">
              <animate attributeName="cy" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="15;7;15" keyTimes="0;0.5;1" />
              <animate attributeName="opacity" dur="0.8s" begin="0.3s" repeatCount="indefinite" values="0.4;1;0.4" keyTimes="0;0.5;1" />
            </circle>
          </svg>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
