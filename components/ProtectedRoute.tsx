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
      console.log('🛡️ ProtectedRoute: Checking access:', { isLoading, isAuthenticated, user: user?.email, hasInitialized });
      
      // ALWAYS wait if loading
      if (isLoading) {
        console.log('🛡️ ProtectedRoute: Still loading, waiting...');
        return;
      }

      // If we haven't initialized yet, force a check
      if (!hasInitialized) {
        console.log('🛡️ ProtectedRoute: First time check, calling checkAuth...');
        setHasInitialized(true);
        
        const authResult = await checkAuth();
        
        if (!authResult) {
          console.log('🛡️ ProtectedRoute: User not authenticated after check, redirecting to auth');
          setRedirecting(true);
          const currentPath = window.location.pathname;
          router.replace(`/auth?returnUrl=${encodeURIComponent(currentPath)}`);
          return;
        }
        
        console.log('🛡️ ProtectedRoute: User authenticated after check, allowing access');
        setIsChecking(false);
        return;
      }

      // Only redirect if we're done loading AND definitely not authenticated
      if (!isAuthenticated && hasInitialized) {
        console.log('🛡️ ProtectedRoute: User not authenticated after initialization, redirecting to auth');
        setRedirecting(true);
        const currentPath = window.location.pathname;
        router.replace(`/auth?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (isAuthenticated && user) {
        console.log('🛡️ ProtectedRoute: User authenticated, allowing access');
        setIsChecking(false);
      } else if (!isAuthenticated) {
        console.log('🛡️ ProtectedRoute: No auth after init - redirecting');
        setRedirecting(true);
        router.replace('/auth');
      }
    };

    checkAccess();
  }, [isAuthenticated, isLoading, router, user, checkAuth, hasInitialized]);

  // Show loading while checking authentication or redirecting
  if (isLoading || isChecking || redirecting) {
    return fallback || <LoadingSpinner />;
  }

  // User is not authenticated - prevent any render
  if (!isAuthenticated || !user) {
    console.log('🛡️ ProtectedRoute: Blocking render - no auth');
    return null; // Will redirect in useEffect
  }

  // Check role requirements
  if (requiredRole) {
    const roleHierarchy = { user: 0, admin: 1, superadmin: 2 };
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return <UnauthorizedFallback />;
    }
  }

  // Note: Suspended users CAN access protected routes and login
  // They will see suspension banner and have restricted actions
  // Only 'deleted' status users are blocked at the auth level

  // Check if email is verified for certain actions
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

  // All checks passed, render children
  return <>{children}</>;
};