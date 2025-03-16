"use client";

import { useState, useEffect } from 'react';
import { Account } from '@/types/account';
import { ACCOUNT_SELECTION_CHANGE } from '@/components/accounts/AccountFilter';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Load accounts from localStorage
  useEffect(() => {
    const storedAccounts = localStorage.getItem('tradingJournalAccounts');
    if (storedAccounts) {
      const loadedAccounts = JSON.parse(storedAccounts);
      setAccounts(loadedAccounts);
      
      // Load previously selected accounts if available
      const storedSelectedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
      if (storedSelectedAccounts) {
        setSelectedAccounts(JSON.parse(storedSelectedAccounts));
      } else {
        // Initially select all accounts if no selection is stored
        setSelectedAccounts(loadedAccounts.map((a: Account) => a.id));
        localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(loadedAccounts.map((a: Account) => a.id)));
      }
    } else {
      // Initialize with a default account if none exist
      const defaultAccount: Account = {
        id: crypto.randomUUID(),
        name: "Default Account",
        createdAt: new Date().toISOString(),
        isArchived: false
      };
      setAccounts([defaultAccount]);
      setSelectedAccounts([defaultAccount.id]);
      localStorage.setItem('tradingJournalAccounts', JSON.stringify([defaultAccount]));
      localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify([defaultAccount.id]));
    }
  }, []);

  // Listen for account selection changes from other components
  useEffect(() => {
    const handleAccountSelectionChange = (event: CustomEvent) => {
      if (event.detail?.selectedAccounts) {
        setSelectedAccounts(event.detail.selectedAccounts);
      } else {
        // Refresh selected accounts from localStorage
        const storedSelectedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
        if (storedSelectedAccounts) {
          setSelectedAccounts(JSON.parse(storedSelectedAccounts));
        }
      }
    };

    window.addEventListener(
      ACCOUNT_SELECTION_CHANGE, 
      handleAccountSelectionChange as EventListener
    );
    
    return () => {
      window.removeEventListener(
        ACCOUNT_SELECTION_CHANGE, 
        handleAccountSelectionChange as EventListener
      );
    };
  }, []);

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      const newSelection = prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId];
      
      // Store the selection in localStorage
      localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
      return newSelection;
    });
  };

  // Create a new account
  const createAccount = (name: string) => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      isArchived: false
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('tradingJournalAccounts', JSON.stringify(updatedAccounts));
    
    // Automatically select new account
    setSelectedAccounts(prev => {
      const newSelection = [...prev, newAccount.id];
      localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
      return newSelection;
    });
    return newAccount;
  };

  // Archive/unarchive an account
  const toggleArchiveAccount = (accountId: string) => {
    const updatedAccounts = accounts.map(account => 
      account.id === accountId 
        ? { ...account, isArchived: !account.isArchived }
        : account
    );
    setAccounts(updatedAccounts);
    localStorage.setItem('tradingJournalAccounts', JSON.stringify(updatedAccounts));
  };

  return {
    accounts,
    selectedAccounts,
    toggleAccount,
    createAccount,
    toggleArchiveAccount
  };
} 