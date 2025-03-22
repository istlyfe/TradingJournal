import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StoredUserData {
  users: Record<string, AuthUser>;
  currentUser: string | null;
}

// Initialize or get the users data structure
const getUsersData = (): StoredUserData => {
  if (typeof window === 'undefined') {
    return { users: {}, currentUser: null };
  }
  
  const stored = localStorage.getItem('tradingJournalUsers');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored users data', e);
      return { users: {}, currentUser: null };
    }
  }
  
  return { users: {}, currentUser: null };
};

// Save users data to localStorage
const saveUsersData = (data: StoredUserData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tradingJournalUsers', JSON.stringify(data));
    localStorage.setItem('isAuthenticated', data.currentUser ? 'true' : 'false');
  }
};

// Generate a simple unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create demo account if it doesn't exist
const ensureDemoAccount = (): void => {
  const usersData = getUsersData();
  
  // Check if demo account already exists
  const demoExists = Object.values(usersData.users).some(
    user => user.email === 'demo@example.com'
  );
  
  if (!demoExists) {
    // Create demo account
    const demoId = generateId();
    usersData.users[demoId] = {
      id: demoId,
      name: 'Demo User',
      email: 'demo@example.com',
      createdAt: new Date().toISOString(),
    };
    
    saveUsersData(usersData);
  }
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load authentication state
  useEffect(() => {
    // Create demo account if needed
    ensureDemoAccount();
    
    const checkAuth = () => {
      const usersData = getUsersData();
      const isAuth = !!usersData.currentUser;
      setIsAuthenticated(isAuth);
      
      if (isAuth && usersData.currentUser) {
        setUser(usersData.users[usersData.currentUser]);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradingJournalUsers' || e.key === 'isAuthenticated') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const usersData = getUsersData();
      const userFound = Object.values(usersData.users).find(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      // In a real app, you would verify the password hash here
      // For demo, we don't actually check passwords
      if (!userFound) {
        setIsLoading(false);
        return false;
      }
      
      // Update current user
      usersData.currentUser = userFound.id;
      saveUsersData(usersData);
      
      setIsAuthenticated(true);
      setUser(userFound);
      
      // Dispatch event for other tabs
      window.dispatchEvent(new Event('auth-change'));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const usersData = getUsersData();
      
      // Check if email already exists
      const emailExists = Object.values(usersData.users).some(
        u => u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExists) {
        setIsLoading(false);
        return false;
      }
      
      // Create new user
      const userId = generateId();
      const newUser: AuthUser = {
        id: userId,
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      
      // In a real app, you would hash the password here
      
      // Add user to storage
      usersData.users[userId] = newUser;
      usersData.currentUser = userId;
      saveUsersData(usersData);
      
      setIsAuthenticated(true);
      setUser(newUser);
      
      // Dispatch event for other tabs
      window.dispatchEvent(new Event('auth-change'));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    const usersData = getUsersData();
    usersData.currentUser = null;
    saveUsersData(usersData);
    
    setIsAuthenticated(false);
    setUser(null);
    
    // Dispatch event for other tabs
    window.dispatchEvent(new Event('auth-change'));
    
    // Redirect to homepage after logout
    router.push('/');
  }, [router]);

  // Get all users (for admin purposes)
  const getAllUsers = useCallback((): AuthUser[] => {
    const usersData = getUsersData();
    return Object.values(usersData.users);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
    getAllUsers,
  };
} 