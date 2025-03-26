import { useState, useEffect } from 'react';

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export function useAccount() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // Load accounts from localStorage
    const loadAccounts = () => {
      try {
        const storedAccounts = localStorage.getItem('accounts');
        console.log('Stored accounts:', storedAccounts);
        
        if (storedAccounts) {
          const parsedAccounts = JSON.parse(storedAccounts);
          console.log('Parsed accounts:', parsedAccounts);
          setAccounts(parsedAccounts);
          
          // If there's a selected account in localStorage, load it
          const selectedAccountId = localStorage.getItem('selectedAccountId');
          console.log('Selected account ID:', selectedAccountId);
          
          if (selectedAccountId) {
            const account = parsedAccounts.find((acc: Account) => acc.id === selectedAccountId);
            console.log('Found account:', account);
            if (account) {
              setSelectedAccount(account);
            }
          }
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  const selectAccount = (account: Account) => {
    console.log('Selecting account:', account);
    setSelectedAccount(account);
    localStorage.setItem('selectedAccountId', account.id);
    console.log('Selected account after setting:', account);
  };

  const clearSelectedAccount = () => {
    console.log('Clearing selected account');
    setSelectedAccount(null);
    localStorage.removeItem('selectedAccountId');
  };

  // Log state changes
  useEffect(() => {
    console.log('Selected account state changed:', selectedAccount);
  }, [selectedAccount]);

  return {
    selectedAccount,
    accounts,
    selectAccount,
    clearSelectedAccount,
  };
} 