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
      // Get base URL for API calls
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      // Fetch both in parallel for better performance
      const [cartResponse, notificationResponse] = await Promise.all([
        fetch(`${baseUrl}/api/user/cart/count`, {
          credentials: 'include',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }),
        fetch(`${baseUrl}/api/user/notifications/count`, {
          credentials: 'include',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
      ]);

      const cartData = cartResponse.ok ? await cartResponse.json() : { count: 0 };
      const notificationData = notificationResponse.ok ? await notificationResponse.json() : { count: 0 };

      setUserData({
        cartCount: cartData.count || 0,
        notificationCount: notificationData.count || 0
      });
    } catch (error) {
      // Silently fail for better UX - don't log in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch user data:', error);
      }
      setUserData({ cartCount: 0, notificationCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce timer to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      fetchUserData();
    }, 300); // Wait 300ms before fetching

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail?.count !== undefined) {
        setUserData(prev => ({
          ...prev,
          cartCount: event.detail.count
        }));
      } else {
        // Refetch if no count provided
        fetchUserData();
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, [isAuthenticated, user]);

  return {
    ...userData,
    loading,
    isAuthenticated,
    user
  };
};