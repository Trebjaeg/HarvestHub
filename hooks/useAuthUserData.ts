import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  cartCount: number;
  notificationCount: number;
}

export const useAuthUserData = () => {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    cartCount: 0,
    notificationCount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) {
        setUserData({ cartCount: 0, notificationCount: 0 });
        return;
      }

      setLoading(true);
      try {
        // Get base URL for API calls
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

        // Fetch cart count
        const cartResponse = await fetch(`${baseUrl}/api/user/cart/count`, {
          credentials: 'include'
        });
        const cartData = cartResponse.ok ? await cartResponse.json() : { count: 0 };

        // Fetch notification count
        const notificationResponse = await fetch(`${baseUrl}/api/user/notifications/count`, {
          credentials: 'include'
        });
        const notificationData = notificationResponse.ok ? await notificationResponse.json() : { count: 0 };

        setUserData({
          cartCount: cartData.count || 0,
          notificationCount: notificationData.count || 0
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUserData({ cartCount: 0, notificationCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, user]);

  return {
    ...userData,
    loading,
    isAuthenticated,
    user
  };
};