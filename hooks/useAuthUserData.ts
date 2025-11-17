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

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!isAuthenticated || !user) {
      setUserData({ cartCount: 0, notificationCount: 0 });
      return;
    }

    setLoading(true);
    try {
      // Fetch both in parallel for better performance
      const [cartResponse, notificationResponse] = await Promise.all([
        fetch('/api/user/cart/count', {
          credentials: 'include'
        }),
        fetch('/api/user/notifications/count', {
          credentials: 'include'
        })
      ]);

      const cartData = cartResponse.ok ? await cartResponse.json() : { count: 0 };
      const notificationData = notificationResponse.ok ? await notificationResponse.json() : { count: 0 };

      setUserData({
        cartCount: cartData.count || 0,
        notificationCount: notificationData.count || 0
      });
    } catch (error) {
      // Silently fail - don't break the UI
      setUserData({ cartCount: 0, notificationCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when component mounts and user is authenticated
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail?.count !== undefined) {
        setUserData(prev => ({
          ...prev,
          cartCount: event.detail.count
        }));
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, []);

  return {
    ...userData,
    loading,
    isAuthenticated,
    user
  };
};