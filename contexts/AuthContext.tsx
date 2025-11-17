"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-utils';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'superadmin' | 'seller' | 'farmer';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  profileImage?: string;
  lastLogin?: Date;
  suspendReason?: string | null;
  suspendedAt?: Date | string | null;
  suspendedBy?: string | null;
  suspensionExpiresAt?: Date | string | null;
  sellerStatus?: 'none' | 'pending' | 'verified' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      
      
      // Log current cookies to debug
      if (typeof window !== 'undefined') {
        
      }
      
      const response = await apiRequest('/api/auth/me', {
        method: 'GET',
      });

      

      if (response.ok) {
        const userData = await response.json();
        
        setUser(userData.user);
        
        // Store in sessionStorage as backup
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(userData.user));
        }
        
        return true;
      } else {
        
        setUser(null);
        
        // Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_user');
        }
        
        return false;
      }
    } catch (error) {
      // IMPORTANT: Don't logout on network errors!
      // Keep user logged in if there's a network issue (network change, offline, etc.)
      // Only logout if it's an actual auth failure (401/403)
      
      // Check if it's a network error
      const isNetworkError = 
        error instanceof TypeError || 
        (error as any)?.message?.includes('fetch') ||
        (error as any)?.message?.includes('network') ||
        (error as any)?.message?.includes('Failed to fetch') ||
        !navigator.onLine;
      
      if (isNetworkError) {
        // Network error - try to restore user from sessionStorage
        if (typeof window !== 'undefined') {
          const cachedUser = sessionStorage.getItem('auth_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              return true;
            } catch (e) {
              // Invalid cached data
            }
          }
        }
      } else {
        // Real auth error, logout
        setUser(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_user');
        }
      }
      return false;
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      
      const data = await response.json();
      

      if (response.ok && data.success) {
        
        setUser(data.user);
        
        // Store token in localStorage as fallback for mobile browsers where cookies may not work
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(data.user));
          
          // Store token for Authorization header fallback (important for mobile)
          if (data.token) {
            localStorage.setItem('hh_token', data.token);
            
          }
        }
        
        return { success: true };
      } else {
        
        return { 
          success: false, 
          message: data.message || 'Login failed',
          requiresVerification: data.requiresVerification 
        };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('hh_token');
        sessionStorage.removeItem('auth_user');
        
        // Trigger storage event for other tabs
        localStorage.setItem('auth-logout', Date.now().toString());
        localStorage.removeItem('auth-logout');
      }
      
      // Force a hard redirect to clear any cached state
      window.location.href = '/';
    }
  };

  // Check auth on mount 
  useEffect(() => {
    const initAuth = async () => {
      // SIMPLE RULE: Only check auth if we're NOT on the auth page
      const isOnAuthPage = typeof window !== 'undefined' && window.location.pathname === '/auth';
      
      if (isOnAuthPage) {
        // On auth page - don't check, just set as not loading
        
        setIsLoading(false);
        setUser(null);
        return;
      }

      // Not on auth page - check if user is authenticated IMMEDIATELY
      
      try {
        const authResult = await checkAuth();
        
        
        if (!authResult) {
          // Clear any stale data
          setUser(null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('🔐 AuthContext: Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [checkAuth]);

  // Listen for storage events (logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-logout') {
        setUser(null);
        router.push('/auth');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  // Handle network reconnection - re-check auth without logging out
  useEffect(() => {
    let checkTimeout: NodeJS.Timeout;
    
    const handleOnline = () => {
      // Wait a bit before checking auth to let network stabilize
      clearTimeout(checkTimeout);
      checkTimeout = setTimeout(() => {
        // Silently check auth when network reconnects, but don't logout on failure
        checkAuth().catch(() => {
          // Keep user logged in even if auth check fails
        });
      }, 1000); // Wait 1 second for network to stabilize
    };

    const handleOffline = () => {
      // Clear any pending auth checks when going offline
      clearTimeout(checkTimeout);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearTimeout(checkTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAuth]);

  // Handle app visibility changes (mobile background/foreground)
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App came back to foreground - restore user from cache if available
        if (!user) {
          const cachedUser = sessionStorage.getItem('auth_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (e) {
              // Invalid cache
            }
          }
        }
        
        // Wait before checking auth to avoid immediate logout
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          // Silently check auth, but keep user logged in on failure
          checkAuth().catch(() => {
            // Keep user logged in even if check fails
          });
        }, 2000); // Wait 2 seconds after app becomes visible
      } else {
        // App went to background - save user to cache
        if (user) {
          sessionStorage.setItem('auth_user', JSON.stringify(user));
        }
        // Cancel any pending auth checks
        clearTimeout(visibilityTimeout);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
