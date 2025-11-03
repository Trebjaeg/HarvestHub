"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from "./auth/page";

export default function RootPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      router.push('/home');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            viewBox="0 0 120 30"
            className="w-12 h-8"
            role="img"
            aria-label="loading"
            xmlns="http://www.w3.org/2000/svg"
          >
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
    );
  }

  // Show auth page for non-authenticated users
  return (
    <div>
      <AuthPage />
    </div>
  );
}
