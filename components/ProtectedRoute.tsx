"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'superadmin';
  fallback?: React.ReactNode;
}

const LoadingSpinner = () => (
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
          <animate
            attributeName="cy"
            dur="0.8s"
            begin="0s"
            repeatCount="indefinite"
            values="15;7;15"
            keyTimes="0;0.5;1"
          />
          <animate
            attributeName="opacity"
            dur="0.8s"
            begin="0s"
            repeatCount="indefinite"
            values="0.4;1;0.4"
            keyTimes="0;0.5;1"
          />
        </circle>
        <circle cx={60} cy={15} r={8} fill="#103C2E">
          <animate
            attributeName="cy"
            dur="0.8s"
            begin="0.15s"
            repeatCount="indefinite"
            values="15;7;15"
            keyTimes="0;0.5;1"
          />
          <animate
            attributeName="opacity"
            dur="0.8s"
            begin="0.15s"
            repeatCount="indefinite"
            values="0.4;1;0.4"
            keyTimes="0;0.5;1"
          />
        </circle>
        <circle cx={90} cy={15} r={8} fill="#103C2E">
          <animate
            attributeName="cy"
            dur="0.8s"
            begin="0.3s"
            repeatCount="indefinite"
            values="15;7;15"
            keyTimes="0;0.5;1"
          />
          <animate
            attributeName="opacity"
            dur="0.8s"
            begin="0.3s"
            repeatCount="indefinite"
            values="0.4;1;0.4"
            keyTimes="0;0.5;1"
          />
        </circle>
      </svg>
      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
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

  // Check if user account is suspended
  if (user.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h1>
          <p className="text-gray-600 mb-4">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <button 
            onClick={() => router.push('/contact')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

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