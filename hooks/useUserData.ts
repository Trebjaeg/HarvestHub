'use client';

import { useState, useEffect } from 'react';

interface UserData {
  isAuthenticated: boolean;
  cartCount: number;
  notificationCount: number;
}

export const useUserData = (): UserData => {
  const [userData, setUserData] = useState<UserData>({
    isAuthenticated: false,
    cartCount: 0,
    notificationCount: 0,
  });

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        // Check if user has auth token
        const token = localStorage.getItem('hh_token') || 
                     localStorage.getItem('auth-token') || 
                     localStorage.getItem('userToken');

        if (!token) {
          setUserData({
            isAuthenticated: false,
            cartCount: 0,
            notificationCount: 0,
          });
          return;
        }

        // Verify token and get user data
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Get cart count
          const cartResponse = await fetch('/api/user/cart/count', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          // Get notification count
          const notificationResponse = await fetch('/api/user/notifications/count', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          const cartCount = cartResponse.ok ? (await cartResponse.json()).count || 0 : 0;
          const notificationCount = notificationResponse.ok ? (await notificationResponse.json()).count || 0 : 0;

          setUserData({
            isAuthenticated: true,
            cartCount,
            notificationCount,
          });
        } else {
          // Invalid token, clear it
          localStorage.removeItem('hh_token');
          localStorage.removeItem('auth-token');
          localStorage.removeItem('userToken');
          
          setUserData({
            isAuthenticated: false,
            cartCount: 0,
            notificationCount: 0,
          });
        }
      } catch (error) {
        console.error('Error checking user authentication:', error);
        setUserData({
          isAuthenticated: false,
          cartCount: 0,
          notificationCount: 0,
        });
      }
    };

    checkUserAuth();
  }, []);

  return userData;
};