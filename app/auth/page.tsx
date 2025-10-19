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
      console.log('🔐 AuthPage: User already authenticated, redirecting to /home');
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Always show the auth form - no loading screens
  return <AuthLanding />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
