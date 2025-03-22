import { useState, useEffect } from 'react';
import { ACCOUNT_CREATED, ACCOUNT_SELECTION_CHANGE } from '@/components/accounts/AccountFilter';

export interface Account {
  id: string;
  name: string;
  createdAt: string;
  isArchived: boolean;
  color?: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load accounts and selected accounts from localStorage
  useEffect(() => {
    const loadAccountsFromStorage = () => {
      // Try to load accounts from localStorage first
      const storedAccounts = localStorage.getItem('tradingJournalAccounts');
      let loadedAccounts: Account[] = [];
      
      if (storedAccounts) {
        try {
          loadedAccounts = JSON.parse(storedAccounts);
          setAccounts(loadedAccounts);
        } catch (error) {
          console.error("Error parsing accounts from localStorage:", error);
        }
      }
      
      // If no accounts were loaded, initialize with default account
      if (!storedAccounts || loadedAccounts.length === 0) {
        const defaultAccount: Account = {
          id: '1',
          name: 'Default Account',
          createdAt: new Date().toISOString(),
          isArchived: false,
          color: '#7C3AED' // Default purple color
        };
        
        loadedAccounts = [defaultAccount];
        setAccounts(loadedAccounts);
        localStorage.setItem('tradingJournalAccounts', JSON.stringify(loadedAccounts));
      }
      
      return loadedAccounts;
    };
    
    const loadSelectedAccountsFromStorage = (loadedAccounts: Account[]) => {
      // Try to load selected accounts from localStorage
      const storedSelectedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
      if (storedSelectedAccounts) {
        try {
          const parsedSelectedAccounts = JSON.parse(storedSelectedAccounts);
          setSelectedAccounts(parsedSelectedAccounts);
        } catch (error) {
          console.error("Error parsing selected accounts from localStorage:", error);
          // Fall back to selecting all accounts
          setSelectedAccounts(loadedAccounts.map(acc => acc.id));
        }
      } else {
        // If no selected accounts in localStorage, select all accounts
        setSelectedAccounts(loadedAccounts.map(acc => acc.id));
        localStorage.setItem(
          'tradingJournalSelectedAccounts', 
          JSON.stringify(loadedAccounts.map(acc => acc.id))
        );
      }
    };
    
    // Initial load
    const loadedAccounts = loadAccountsFromStorage();
    loadSelectedAccountsFromStorage(loadedAccounts);
    setInitialized(true);
    
    // Set up event listeners for real-time updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradingJournalAccounts') {
        const updatedAccounts = loadAccountsFromStorage();
        loadSelectedAccountsFromStorage(updatedAccounts);
      } 
      else if (e.key === 'tradingJournalSelectedAccounts') {
        loadSelectedAccountsFromStorage(accounts);
      }
    };
    
    const handleSelectionChange = (e: CustomEvent) => {
      if (e.detail?.selectedAccounts) {
        setSelectedAccounts(e.detail.selectedAccounts);
      }
    };
    
    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Handle local storage changes (same tab)
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange as EventListener);
    };
  }, []);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (initialized && accounts.length > 0) {
      localStorage.setItem('tradingJournalAccounts', JSON.stringify(accounts));
    }
  }, [accounts, initialized]);

  // Save selected accounts to localStorage whenever they change
  useEffect(() => {
    if (initialized && selectedAccounts.length >= 0) {
      localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(selectedAccounts));
    }
  }, [selectedAccounts, initialized]);

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      const newSelection = prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId];
        
      return newSelection;
    });
  };

  // Create a new account
  const createAccount = (name: string, color?: string) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      isArchived: false,
      color: color || '#' + Math.floor(Math.random()*16777215).toString(16) // Random color if none provided
    };

    // Update accounts in state
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    
    // Also select the new account
    const updatedSelection = [...selectedAccounts, newAccount.id];
    setSelectedAccounts(updatedSelection);
    
    // Update localStorage directly
    localStorage.setItem('tradingJournalAccounts', JSON.stringify(updatedAccounts));
    
    // Update localStorage for selected accounts
    localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(updatedSelection));
    
    // Dispatch account creation event
    window.dispatchEvent(new CustomEvent(ACCOUNT_CREATED, { 
      detail: { newAccount }
    }));
    
    // Dispatch selection change event
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: updatedSelection }
    }));
    
    // Force storage event for other components
    window.dispatchEvent(new Event('storage'));
    
    return newAccount;
  };

  // Archive/unarchive an account
  const toggleArchiveAccount = (accountId: string) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === accountId 
          ? { ...account, isArchived: !account.isArchived }
          : account
      )
    );
  };

  return {
    accounts,
    selectedAccounts,
    toggleAccount,
    createAccount,
    toggleArchiveAccount
  };
}