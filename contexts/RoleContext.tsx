"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface RoleContextType {
  currentRole: 'buyer' | 'seller' | null;
  isRoleLoading: boolean;
  preserveRoleNavigation: (route: string) => string;
  getRoleBasedMessages: () => string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<'buyer' | 'seller' | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    setIsRoleLoading(true);
    
    if (!isAuthenticated || !user || !pathname) {
      setCurrentRole(null);
      setIsRoleLoading(false);
      return;
    }

    // Determine role based on current route context
    let detectedRole: 'buyer' | 'seller' | null = null;
    
    if (pathname.includes('buyerdashboard') || pathname.includes('inbox')) {
      detectedRole = 'buyer';
    } else if (pathname.includes('sellerdashboard') || pathname.includes('message')) {
      detectedRole = 'seller';
    } else if (pathname === '/messages') {
      // Default messages route - use user's role preference or default to buyer
      const savedRole = localStorage.getItem('preferredRole');
      // Check if user has seller capabilities (role: 'seller', 'admin', or 'superadmin')
      const canBeSeller = user.role === 'admin' || user.role === 'superadmin' || 
                         (user as any).sellerStatus === 'verified';
      
      if (savedRole === 'seller' && canBeSeller) {
        detectedRole = 'seller';
      } else {
        detectedRole = 'buyer'; // Default to buyer for messages
      }
    }

    // Validate role against user permissions
    const canBeSeller = user.role === 'admin' || user.role === 'superadmin' || 
                       (user as any).sellerStatus === 'verified';
    
    if (detectedRole === 'seller' && !canBeSeller) {
      // User is not a seller but trying to access seller context
      detectedRole = 'buyer';
    }

    setCurrentRole(detectedRole);
    setIsRoleLoading(false);

    // Save role preference for future navigation
    if (detectedRole) {
      localStorage.setItem('preferredRole', detectedRole);
    }

    console.log('🎭 Role Context: Updated role', {
      pathname,
      detectedRole,
      userRole: user.role,
      userEmail: user.email,
      canBeSeller,
      sellerStatus: (user as any).sellerStatus
    });
  }, [pathname, user, isAuthenticated]);

  const preserveRoleNavigation = (route: string): string => {
    if (!currentRole) return route;
    
    // If navigating to generic messages, preserve role context
    if (route === '/messages') {
      switch (currentRole) {
        case 'buyer':
          return '/inbox';
        case 'seller':
          return '/message';
        default:
          return route;
      }
    }
    
    return route;
  };

  const getRoleBasedMessages = (): string => {
    switch (currentRole) {
      case 'buyer':
        return '/inbox';
      case 'seller':
        return '/message';
      default:
        return '/messages';
    }
  };

  const value: RoleContextType = {
    currentRole,
    isRoleLoading,
    preserveRoleNavigation,
    getRoleBasedMessages
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};