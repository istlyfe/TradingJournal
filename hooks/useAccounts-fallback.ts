import { useState, useEffect } from 'react';

export interface Account {
  id: string;
  name: string;
  createdAt: string;
  isArchived: boolean;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Initialize with default account
  useEffect(() => {
    const defaultAccount: Account = {
      id: '1',
      name: 'Default Account',
      createdAt: new Date().toISOString(),
      isArchived: false
    };
    
    setAccounts([defaultAccount]);
    setSelectedAccounts([defaultAccount.id]);
  }, []);

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // Create a new account
  const createAccount = (name: string) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      isArchived: false
    };

    setAccounts(prev => [...prev, newAccount]);
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