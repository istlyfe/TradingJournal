"use client";

import { useState, useEffect } from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
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

export function AccountFilter() {
  const { accounts, selectedAccounts, toggleAccount } = useAccounts();
  const [open, setOpen] = useState(false);

  const allSelected = accounts.length > 0 && selectedAccounts.length === accounts.length;
  const displayValue = allSelected
    ? "All accounts"
    : selectedAccounts.length === 0
    ? "No accounts"
    : selectedAccounts.length === 1
    ? accounts.find(account => account.id === selectedAccounts[0])?.name || "1 account"
    : `${selectedAccounts.length} accounts`;

  // Toggle all accounts at once
  const toggleAllAccounts = () => {
    // Get all account IDs
    const allAccountIds = accounts.map(account => account.id);
    
    // Determine new selection state
    const newSelection = allSelected ? [] : allAccountIds;
    console.log("Setting all accounts selection to:", newSelection);
    
    // Update localStorage directly
    localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
    
    // Dispatch custom event with the new selection
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, { 
      detail: { selectedAccounts: newSelection }
    }));
    
    // Force a page reload to ensure all components see the changes
    window.location.reload();
  };

  // Handle individual account toggle
  const handleToggleAccount = (accountId: string) => {
    // Call the toggleAccount function from useAccounts
    toggleAccount(accountId);
    
    // Get the new selection state (after toggle)
    const newSelection = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter(id => id !== accountId)
      : [...selectedAccounts, accountId];
    
    console.log("Account toggled, new selection:", newSelection);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent(ACCOUNT_SELECTION_CHANGE, {
      detail: { selectedAccounts: newSelection }
    }));
    
    // Force a page reload to ensure all components see the changes
    window.location.reload();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={toggleAllAccounts}
                className="text-sm"
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  allSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                )}>
                  <CheckIcon className="h-4 w-4" />
                </div>
                <span>All accounts</span>
              </CommandItem>

              <CommandSeparator />

              {accounts.map(account => {
                const isSelected = selectedAccounts.includes(account.id);
                return (
                  <CommandItem
                    key={account.id}
                    onSelect={() => handleToggleAccount(account.id)}
                    className="text-sm"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <span>{account.name}</span>
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