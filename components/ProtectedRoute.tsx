"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingDots from '@/components/ui/LoadingDots';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'superadmin';
  fallback?: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <LoadingDots size="lg" color="#103C2E" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Loading
      </h3>
      <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Please wait
      </p>
    </div>
  </div>
);

const UnauthorizedFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user',
  fallback 
}) => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) {
        return;
      }

      if (!hasInitialized) {
        setHasInitialized(true);
        
        const authResult = await checkAuth();
        
        if (!authResult) {
          setRedirecting(true);
          const currentPath = window.location.pathname;
          router.replace(`/auth?returnUrl=${encodeURIComponent(currentPath)}`);
          return;
        }
        
        setIsChecking(false);
        return;
      }

      if (!isAuthenticated && hasInitialized) {
        setRedirecting(true);
        const currentPath = window.location.pathname;
        router.replace(`/auth?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (isAuthenticated && user) {
        setIsChecking(false);
      } else if (!isAuthenticated) {
        setRedirecting(true);
        router.replace('/auth');
      }
    };

    checkAccess();
  }, [isAuthenticated, isLoading, router, user, checkAuth, hasInitialized]);

  if (isLoading || isChecking || redirecting) {
    return fallback || <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole) {
    const roleHierarchy = { 
      user: 0, 
      seller: 0, 
      farmer: 0, 
      admin: 1, 
      superadmin: 2 
    };
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return <UnauthorizedFallback />;
    }
  }

  if (!user.emailVerified && requiredRole && requiredRole !== 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Email Verification Required</h1>
          <p className="text-gray-600 mb-4">
            Please verify your email address to access this feature.
          </p>
          <button 
            onClick={() => router.push('/auth/verify')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Verify Email
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};