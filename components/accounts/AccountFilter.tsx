"use client";

// DEPRECATED - Now handled in AccountsPanel.tsx directly
// This file is kept only for backward compatibility
// All functionality has been moved to AccountsPanel.tsx

import { useState, useEffect, useCallback } from "react";
import { CheckIcon, ChevronsUpDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAccounts } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";

// Custom event for account selection changes
export const ACCOUNT_SELECTION_CHANGE = 'account-selection-change';
// Custom event for account creation
export const ACCOUNT_CREATED = 'account-created';

export function AccountFilter() {
  const { accounts, selectedAccounts, toggleAccount } = useAccounts();
  const [open, setOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const allSelected = accounts.length > 0 && selectedAccounts.length === accounts.length;
  const displayValue = allSelected
    ? "All accounts"
    : selectedAccounts.length === 0
    ? "No accounts"
    : selectedAccounts.length === 1
    ? accounts.find(account => account.id === selectedAccounts[0])?.name || "1 account"
    : `${selectedAccounts.length} accounts`;

  // Force refresh when accounts are created
  useEffect(() => {
    const handleAccountCreated = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener(ACCOUNT_CREATED, handleAccountCreated);
    
    return () => {
      window.removeEventListener(ACCOUNT_CREATED, handleAccountCreated);
    };
  }, []);
  
  // Sync localStorage with selectedAccounts on component mount and when selectedAccounts changes
  useEffect(() => {
    localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(selectedAccounts));
    
    // Dispatch event so other components can react to the change
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: selectedAccounts }
    }));
  }, [selectedAccounts, forceUpdate]);

  // Toggle all accounts at once
  const toggleAllAccounts = useCallback(() => {
    // Get all account IDs
    const allAccountIds = accounts.map(account => account.id);
    
    // Determine new selection state
    const newSelection = allSelected ? [] : allAccountIds;
    
    // Update localStorage directly
    localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
    
    // Dispatch custom event with the new selection
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: newSelection }
    }));
    
    // Call useAccounts hook to update internal state
    accounts.forEach(account => {
      const shouldBeSelected = newSelection.includes(account.id);
      const isCurrentlySelected = selectedAccounts.includes(account.id);
      
      if (shouldBeSelected !== isCurrentlySelected) {
        toggleAccount(account.id);
      }
    });
  }, [accounts, selectedAccounts, allSelected, toggleAccount]);

  // Handle individual account toggle
  const handleToggleAccount = useCallback((accountId: string) => {
    // Call the toggleAccount function from useAccounts
    toggleAccount(accountId);
    
    // The event will be dispatched in the useEffect above
  }, [toggleAccount]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between border border-slate-800 bg-background/90 px-3 py-2 text-base font-medium"
        >
          <div className="flex items-center">
            {selectedAccounts.length > 0 && selectedAccounts.length < accounts.length && (
              <div className="flex -space-x-1 mr-2">
                {selectedAccounts.slice(0, 3).map(accountId => {
                  const account = accounts.find(a => a.id === accountId);
                  return account?.color ? (
                    <div 
                      key={accountId}
                      className="w-3 h-3 rounded-full border border-background"
                      style={{ backgroundColor: account.color || '#888888' }}
                    />
                  ) : null;
                })}
              </div>
            )}
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0 bg-background border"
        align="start"
        side="bottom"
        sideOffset={4}
        alignOffset={0}
        collisionBoundary={null}
        sticky="always"
      >
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={toggleAllAccounts}
                className="text-sm"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    allSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <CheckIcon className="h-4 w-4" />
                  </div>
                  <span>All accounts</span>
                </div>
              </CommandItem>

              <CommandSeparator />

              {accounts.map(account => {
                const isSelected = selectedAccounts.includes(account.id);
                return (
                  <CommandItem
                    key={account.id}
                    onSelect={() => handleToggleAccount(account.id)}
                    className="text-sm flex items-center py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}>
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        {account.color && (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: account.color || '#888888' }}
                          />
                        )}
                        <span className="truncate">{account.name}</span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 