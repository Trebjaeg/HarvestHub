"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ExtendedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'superadmin' | 'seller' | 'farmer';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  profileImage?: string;
  sellerStatus?: string;
  sellerApplicationStatus?: string;
}

export const NotificationHandler = () => {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only handle if we have notification parameters
    const userId = searchParams?.get('userId');
    const notificationId = searchParams?.get('notificationId');
    
    if (!userId && !notificationId) return;
    if (!user) return;

    const extendedUser = user as ExtendedUser;
    const currentPath = window.location.pathname;

    console.log('🔔 Notification Handler: Processing notification access', {
      userId,
      notificationId,
      userRole: extendedUser.role,
      sellerStatus: extendedUser.sellerStatus,
      userEmail: extendedUser.email,
      currentPath
    });

    // Enhanced seller detection - check role first, then sellerStatus
    const isSeller = 
      extendedUser.role === 'seller' ||
      extendedUser.role === 'farmer' ||
      extendedUser.role === 'admin' || 
      extendedUser.role === 'superadmin' ||
      extendedUser.sellerStatus === 'verified' ||
      extendedUser.sellerApplicationStatus === 'approved' ||
      // Check if user object has seller-related properties
      Object.keys(extendedUser).some(key => 
        key.toLowerCase().includes('seller') && 
        (extendedUser as any)[key] === true
      );

    console.log('🔍 Enhanced Seller Detection:', {
      isSeller,
      userRole: extendedUser.role,
      sellerStatus: extendedUser.sellerStatus,
      sellerAppStatus: extendedUser.sellerApplicationStatus,
      allUserKeys: Object.keys(extendedUser)
    });

    // Determine target route with parameters
    let targetRoute = '';
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (notificationId) params.append('notificationId', notificationId);
    const queryString = params.toString();

    if (isSeller) {
      targetRoute = `/message${queryString ? '?' + queryString : ''}`;
      console.log('🎯 SELLER should go to:', targetRoute);
    } else {
      targetRoute = `/inbox${queryString ? '?' + queryString : ''}`;
      console.log('🎯 BUYER should go to:', targetRoute);
    }

    // Check current path and force redirect if needed
    const isOnSellerInterface = currentPath.includes('/message');
    const isOnBuyerInterface = currentPath.includes('/inbox');
    const isOnSystemMessages = currentPath.includes('/messages');
    
    const shouldRedirect = 
      // Seller on wrong interface
      (isSeller && !isOnSellerInterface) ||
      // Buyer on wrong interface  
      (!isSeller && !isOnBuyerInterface) ||
      // Anyone on system messages with notification params
      (isOnSystemMessages && (userId || notificationId));

    console.log('🔍 Redirect Decision:', {
      currentPath,
      isSeller,
      isOnSellerInterface,
      isOnBuyerInterface,
      isOnSystemMessages,
      shouldRedirect,
      targetRoute
    });

    if (shouldRedirect) {
      console.log('🔄 FORCE REDIRECTING to:', targetRoute);
      // Use replace to avoid back button issues
      router.replace(targetRoute);
    } else {
      console.log('✅ User is on correct interface');
    }
  }, [searchParams, user, router]);

  return null;
};