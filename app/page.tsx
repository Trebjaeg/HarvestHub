"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from "./auth/page";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🏠 RootPage: Auth state changed', { 
      isLoading, 
      hasUser: !!user,
      userEmail: user?.email 
    });
    
    // If user is authenticated, redirect to home
    if (!isLoading && user) {
      console.log('🏠 RootPage: Redirecting authenticated user to /home');
      router.push('/home');
    } else if (!isLoading && !user) {
      console.log('🏠 RootPage: User not authenticated, staying on auth page');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
