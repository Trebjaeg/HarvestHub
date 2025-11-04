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
      const response = await makeApiRequest('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(userData.user));
        }
        
        return true;
      } else {
        setUser(null);
        
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_user');
        }
        
        return false;
      }
    } catch (error) {
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
      const response = await makeApiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('auth-token');
        sessionStorage.removeItem('auth_user');
      }
      router.push('/');
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = sessionStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (error) {
            sessionStorage.removeItem('auth_user');
          }
        }
      }
      
      await checkAuth();
      setIsLoading(false);
    };

    initAuth();
  }, [checkAuth]);

  // Session check effect
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const sessionCheckInterval = setInterval(async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        logout();
      }
    }, 5 * 60 * 1000);

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