import { useState, useEffect, useCallback } from 'react';
import { Account } from '@/types/account';
import { useSession } from 'next-auth/react';

export function useAccounts() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts from API
  const fetchAccounts = useCallback(async () => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
        
        // If no accounts are selected, select all by default
        if (selectedAccounts.length === 0 && data.accounts.length > 0) {
          setSelectedAccounts(data.accounts.map((acc: Account) => acc.id));
        }
      } else {
        throw new Error(data.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email, selectedAccounts.length]);

  // Create new account
  const createAccount = useCallback(async (accountData: Partial<Account>) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add new account to local state
        setAccounts(prev => [...prev, data.account]);
        
        // Select the new account by default
        setSelectedAccounts(prev => [...prev, data.account.id]);
        
        return data.account;
      } else {
        throw new Error(data.message || 'Failed to create account');
      }
    } catch (err) {
      console.error('Error creating account:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Update account
  const updateAccount = useCallback(async (accountId: string, updates: Partial<Account>) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update account');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update account in local state
        setAccounts(prev => prev.map(acc => 
          acc.id === accountId ? { ...acc, ...updates } : acc
        ));
        return data.account;
      } else {
        throw new Error(data.message || 'Failed to update account');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Delete account
  const deleteAccount = useCallback(async (accountId: string) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove account from local state
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        
        // Remove from selected accounts
        setSelectedAccounts(prev => prev.filter(id => id !== accountId));
        
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Toggle account selection
  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  }, []);

  // Load accounts when session changes
  useEffect(() => {
    if (session?.user?.email) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setSelectedAccounts([]);
    }
  }, [session?.user?.email, fetchAccounts]);

  // Fallback to localStorage if API fails (for backward compatibility)
  useEffect(() => {
    if (accounts.length === 0 && !isLoading && session?.user?.email) {
      try {
        const storedAccounts = localStorage.getItem('tradingJournalAccounts');
        if (storedAccounts) {
          const parsedAccounts = JSON.parse(storedAccounts);
          setAccounts(parsedAccounts);
          
          // Select all accounts by default
          if (parsedAccounts.length > 0) {
            setSelectedAccounts(parsedAccounts.map((acc: Account) => acc.id));
          }
        }
      } catch (error) {
        console.error('Error loading accounts from localStorage:', error);
      }
    }
  }, [accounts, isLoading, session?.user?.email]);

  return {
    accounts,
    selectedAccounts,
    setSelectedAccounts,
    toggleAccount,
    isLoading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    setAccounts, // Keep for backward compatibility
  };
}