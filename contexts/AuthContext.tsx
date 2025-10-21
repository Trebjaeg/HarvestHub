"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-utils';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  profileImage?: string;
  lastLogin?: Date;
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
      console.log('🔐 AuthContext: Checking authentication...');
      
      // Log current cookies to debug
      if (typeof window !== 'undefined') {
        console.log('🔐 AuthContext: Current cookies:', document.cookie);
      }
      
      const response = await apiRequest('/api/auth/me', {
        method: 'GET',
      });

      console.log('🔐 AuthContext: Auth check response:', { status: response.status });

      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 AuthContext: User authenticated:', userData.user?.email);
        setUser(userData.user);
        
        // Store in sessionStorage as backup
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(userData.user));
        }
        
        return true;
      } else {
        console.log('🔐 AuthContext: User not authenticated');
        setUser(null);
        
        // Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_user');
        }
        
        return false;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Auth check failed:', error);
      setUser(null);
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
      console.log('🔐 AuthContext: Starting login for:', email);
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 AuthContext: Response status:', response.status);
      const data = await response.json();
      console.log('🔐 AuthContext: Response data:', data);

      if (response.ok && data.success) {
        console.log('🔐 AuthContext: Login successful, setting user');
        setUser(data.user);
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        
        return { success: true };
      } else {
        console.log('🔐 AuthContext: Login failed:', data.message);
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
      window.location.href = '/auth';
    }
  };

  // Check auth on mount 
  useEffect(() => {
    const initAuth = async () => {
      // SIMPLE RULE: Only check auth if we're NOT on the auth page
      const isOnAuthPage = typeof window !== 'undefined' && window.location.pathname === '/auth';
      
      if (isOnAuthPage) {
        // On auth page - don't check, just set as not loading
        console.log('🔐 AuthContext: On auth page, skipping auth check');
        setIsLoading(false);
        setUser(null);
        return;
      }

      // Not on auth page - check if user is authenticated IMMEDIATELY
      console.log('🔐 AuthContext: Checking authentication...');
      try {
        const authResult = await checkAuth();
        console.log('🔐 AuthContext: Auth check result:', authResult);
        
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