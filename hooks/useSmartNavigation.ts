"use client";

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationState {
  canGoBack: boolean;
  isFromNotification: boolean;
  previousRoute: string | null;
  userRole: 'buyer' | 'seller' | null;
  shouldPreserveRole: boolean;
  authenticatedUserRole: 'buyer' | 'seller' | null;
}

export const useSmartNavigation = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    canGoBack: false,
    isFromNotification: false,
    previousRoute: null,
    userRole: null,
    shouldPreserveRole: false,
    authenticatedUserRole: null
  });

  useEffect(() => {
    // Check if we came from a notification
    const searchParams = new URLSearchParams(window.location.search);
    const fromNotification = searchParams.has('userId') || searchParams.has('notificationId');
    
    // Determine authenticated user's role capabilities
    let authenticatedUserRole: 'buyer' | 'seller' | null = null;
    
    if (user) {
      // Check if user can be a seller (has seller role, farmer role, admin, or verified seller status)
      const canBeSeller = user.role === 'admin' || 
                         user.role === 'superadmin' || 
                         user.role === 'seller' ||
                         user.role === 'farmer' ||
                         user.sellerStatus === 'verified';
      
      // Prefer seller role if user can be a seller, otherwise default to buyer
      if (canBeSeller) {
        authenticatedUserRole = 'seller';
      } else {
        authenticatedUserRole = 'buyer';
      }
    }
    
    // Determine current interface role based on path (what interface user is currently in)
    const currentPath = window.location.pathname;
    let currentInterfaceRole: 'buyer' | 'seller' | null = null;
    
    if (currentPath.includes('buyerdashboard') || currentPath.includes('inbox')) {
      currentInterfaceRole = 'buyer';
    } else if (currentPath.includes('sellerdashboard') || currentPath.includes('message')) {
      currentInterfaceRole = 'seller';
    }

    // For notifications, use the authenticated user's role, not the current interface
    const userRole = fromNotification ? authenticatedUserRole : currentInterfaceRole;

    // Check if we can use browser back safely
    const hasMinimalHistory = window.history.length <= 2;
    const canUseBack = !fromNotification && !hasMinimalHistory;
    
    // Check referrer to determine if we should preserve role context
    const referrer = document.referrer;
    const shouldPreserveRole = fromNotification || 
                               referrer === '' || 
                               !referrer.includes(window.location.origin) ||
                               hasMinimalHistory;
    
    setNavigationState({
      canGoBack: canUseBack,
      isFromNotification: fromNotification,
      previousRoute: shouldPreserveRole ? getRoleBasedRoute(userRole) : null,
      userRole,
      shouldPreserveRole,
      authenticatedUserRole
    });

    console.log('🧭 Smart Navigation initialized:', {
      canGoBack: canUseBack,
      isFromNotification: fromNotification,
      userRole,
      authenticatedUserRole,
      currentInterfaceRole,
      currentPath,
      historyLength: window.history.length,
      referrer,
      shouldPreserveRole,
      user: user?.email,
      userDbRole: user?.role,
      sellerStatus: user?.sellerStatus
    });
  }, [user]);

  const getRoleBasedRoute = (role: 'buyer' | 'seller' | null): string => {
    switch (role) {
      case 'buyer':
        return '/inbox';
      case 'seller':
        return '/message';
      default:
        return '/';
    }
  };

  const navigateBack = useCallback(() => {
    console.log('🔙 Smart Navigation: Navigating back', navigationState);
    
    if (navigationState.canGoBack && !navigationState.shouldPreserveRole) {
      // Use browser back if we have valid history and context is safe
      console.log('🔙 Using browser back');
      router.back();
    } else {
      // Navigate to role-appropriate route to preserve context
      const fallbackRoute = navigationState.previousRoute || getRoleBasedRoute(navigationState.userRole);
      console.log('🔙 Using role-based route:', fallbackRoute);
      
      // Clear notification parameters when navigating back
      router.push(fallbackRoute);
    }
  }, [navigationState, router]);

  const navigateToMessages = useCallback(() => {
    const messagesRoute = getRoleBasedRoute(navigationState.userRole);
    console.log('💬 Navigating to messages:', messagesRoute);
    router.push(messagesRoute);
  }, [navigationState.userRole, router]);

  return {
    navigateBack,
    navigateToMessages,
    navigationState
  };
};