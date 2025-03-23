"use client";

import { useAccounts } from '@/hooks/useAccounts';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, X, Filter, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

export const ACCOUNT_SELECTION_CHANGE = 'account-selection-change';

// Pre-defined account colors
const accountColors = [
  '#7C3AED', // Purple
  '#2563EB', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6B7280', // Gray
];

export function AccountsPanel() {
  const { accounts, createAccount, selectedAccounts, toggleAccount, setSelectedAccounts } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountColor, setNewAccountColor] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();
  const [forceRefresh, setForceRefresh] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update when accounts change
  useEffect(() => {
    setForceRefresh(prev => prev + 1);
  }, [accounts.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle all accounts at once
  const toggleAllAccounts = useCallback(() => {
    // Toggle selection state
    const newSelection = selectedAccounts.length === accounts.length ? [] : accounts.map(a => a.id);
    
    // Update localStorage directly
    localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
    
    // Dispatch both event types to ensure all components update
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: newSelection }
    }));
    
    window.dispatchEvent(new CustomEvent('account-selection-change', { 
      detail: { selectedAccounts: newSelection }
    }));
    
    // Force global storage event for older components
    window.dispatchEvent(new Event('storage'));
    
    // Update useAccounts hook state
    setSelectedAccounts(newSelection);
    
    // Close the dropdown after a short delay
    setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  }, [accounts, selectedAccounts, setSelectedAccounts]);

  // Handle individual account toggle
  const handleToggleAccount = useCallback((accountId: string) => {
    toggleAccount(accountId);
    
    // Manually dispatch events to ensure all components update
    const newSelection = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter(id => id !== accountId)
      : [...selectedAccounts, accountId];
    
    // Dispatch both event types
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: newSelection }
    }));
    
    window.dispatchEvent(new CustomEvent('account-selection-change', { 
      detail: { selectedAccounts: newSelection }
    }));
    
    // Force global storage event for older components
    window.dispatchEvent(new Event('storage'));
  }, [selectedAccounts, toggleAccount]);

  const myAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);

  return (
    <div className="account-dropdown" ref={dropdownRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={dropdownOpen}
        className={cn(
          "w-full justify-between text-left",
          dropdownOpen ? "border-primary" : ""
        )}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span className="truncate">
          {selectedAccounts.length === 0
            ? "Select accounts"
            : selectedAccounts.length === 1
            ? accounts.find((a) => a.id === selectedAccounts[0])?.name || "1 account"
            : selectedAccounts.length === accounts.length
            ? "All accounts"
            : `${selectedAccounts.length} accounts`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {dropdownOpen && (
        <>
          <div className="account-dropdown-content">
            <div className="p-1">
              <button
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selectedAccounts.length === accounts.length ? "font-medium" : ""
                )}
                onClick={toggleAllAccounts}
              >
                <div className={cn(
                  "mr-2 h-5 w-5 border rounded-sm flex items-center justify-center",
                  selectedAccounts.length === accounts.length ? "bg-primary border-primary" : "border-input"
                )}>
                  {selectedAccounts.length === accounts.length && (
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </div>
                <span>All accounts</span>
              </button>
            </div>
            
            {myAccounts.length > 0 && (
              <div className="p-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  My accounts
                </div>
                {myAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground account-item"
                    onClick={() => handleToggleAccount(account.id)}
                  >
                    <div className={cn(
                      "mr-2 h-5 w-5 border rounded-sm flex items-center justify-center account-checkbox",
                      selectedAccounts.includes(account.id) ? "bg-primary border-primary" : "border-input"
                    )}>
                      {selectedAccounts.includes(account.id) && (
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                    <span>{account.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {archivedAccounts.length > 0 && (
              <div className="p-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Archived accounts
                </div>
                {archivedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground account-item"
                    onClick={() => handleToggleAccount(account.id)}
                  >
                    <div className={cn(
                      "mr-2 h-5 w-5 border rounded-sm flex items-center justify-center account-checkbox",
                      selectedAccounts.includes(account.id) ? "bg-primary border-primary" : "border-input"
                    )}>
                      {selectedAccounts.includes(account.id) && (
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                    <span>{account.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 