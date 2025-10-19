"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Helper to make API requests with correct URL
  const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
    // Use window.location.origin to ensure we use the current port
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}${endpoint}`;
    
    return fetch(url, {
      credentials: 'include',
      ...options,
    });
  };

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Checking authentication...');
      
      const response = await makeApiRequest('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔐 AuthContext: Auth check response:', { status: response.status });

      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 AuthContext: User authenticated:', userData.user.email);
        setUser(userData.user);
        
        // Store in sessionStorage for persistence
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
      console.error('🔐 AuthContext: Auth check error:', error);
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
      
      const response = await makeApiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔐 AuthContext: Login API response:', { status: response.status, data });

      if (response.ok) {
        console.log('🔐 AuthContext: Login successful, setting user data:', data.user);
        setUser(data.user);
        
        // Store in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        
        return true;
      } else {
        console.error('🔐 AuthContext: Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await makeApiRequest('/api/auth/logout', {
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
        sessionStorage.removeItem('auth_user');
      }
      router.push('/auth');
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 AuthContext: Initializing auth...');
      
      // Try to restore user from sessionStorage first
      if (typeof window !== 'undefined') {
        const storedUser = sessionStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('🔐 AuthContext: Restoring user from sessionStorage:', userData.email);
            setUser(userData);
          } catch (error) {
            console.error('🔐 AuthContext: Error parsing stored user:', error);
            sessionStorage.removeItem('auth_user');
          }
        }
      }
      
      // Always verify with server
      const authResult = await checkAuth();
      console.log('🔐 AuthContext: Initial auth check result:', authResult);
      
      setIsLoading(false);
    };

    initAuth();
  }, [checkAuth]);

  // Session check effect
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const sessionCheckInterval = setInterval(async () => {
      console.log('🔐 AuthContext: Periodic session check...');
      const isValid = await checkAuth();
      if (!isValid) {
        console.log('🔐 AuthContext: Session expired, logging out...');
        logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [isAuthenticated, isLoading, checkAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      checkAuth,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;