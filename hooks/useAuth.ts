"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  accounts?: any[];
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load authentication state
  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;
    
    const checkAuth = async () => {
      try {
        // Check authentication with server
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.isAuthenticated) {
            setIsAuthenticated(true);
            setUser(data.user || null);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // If the verify endpoint fails, assume not authenticated
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Poll for authentication status
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    setIsLoading(true);
    
    try {
      // Call the login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Login error:', data.message);
        setIsLoading(false);
        return false;
      }
      
      // Update auth state with the returned user
      if (data.success && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
      }
      
      setIsLoading(false);
      return data.success;
    } catch (error) {
      console.error('Login API error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    setIsLoading(true);
    
    try {
      // Call the register API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Signup error:', data.message);
        setIsLoading(false);
        return false;
      }
      
      // Update auth state with the returned user
      if (data.success && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
      }
      
      setIsLoading(false);
      return data.success;
    } catch (error) {
      console.error('Signup API error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        
        // Navigate to login page
        router.push('/login');
        return true;
      } else {
        console.error('Logout failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      return false;
    }
  }, [router]);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout
  };
} 