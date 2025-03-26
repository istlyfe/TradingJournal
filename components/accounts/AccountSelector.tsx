"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ChevronsUpDown, Check } from "lucide-react";
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

interface AccountSelectorProps {
  selectedId: string;
  onSelect: (accountId: string) => void;
  allowCreateNew?: boolean;
  createNewId?: string;
  fullWidth?: boolean;
  className?: string;
}

export function AccountSelector({ 
  selectedId, 
  onSelect, 
  allowCreateNew = true, 
  createNewId = "new-account",
  fullWidth = true,
  className
}: AccountSelectorProps) {
  const { accounts } = useAccounts();
  const [open, setOpen] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedId);
  const hasCreateNewOption = allowCreateNew && createNewId;

  // Ensure selected account exists
  useEffect(() => {
    if (selectedId && !selectedAccount && selectedId !== createNewId) {
      console.warn(`Selected account ${selectedId} not found`);
      // Optionally reset to default account
      const defaultAccount = accounts[0];
      if (defaultAccount) {
        onSelect(defaultAccount.id);
      }
    }
  }, [selectedId, selectedAccount, accounts, createNewId, onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between border px-3 py-6 text-base font-medium",
            fullWidth ? "w-full" : "w-[200px]",
            className
          )}
        >
          <div className="flex items-center">
            {selectedId === createNewId && hasCreateNewOption ? (
              <div className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2 text-primary" />
                <span>Create New Account</span>
              </div>
            ) : selectedAccount ? (
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: selectedAccount.color || '#888888' }}
                />
                <span>{selectedAccount.name}</span>
              </div>
            ) : (
              <span>Select an account</span>
            )}
          </div>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0 bg-background border", fullWidth ? "w-[var(--radix-popover-trigger-width)]" : "w-[200px]")}
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
      >
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {hasCreateNewOption && (
                <>
                  <CommandItem
                    onSelect={() => {
                      onSelect(createNewId);
                      setOpen(false);
                    }}
                    className="text-sm flex items-center py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <PlusCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Create New Account</span>
                    </div>
                    {selectedId === createNewId && <Check className="h-4 w-4 ml-auto text-primary" />}
                  </CommandItem>
                  <CommandSeparator />
                </>
              )}
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  onSelect={() => {
                    onSelect(account.id);
                    setOpen(false);
                  }}
                  className="text-sm flex items-center py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: account.color || '#888888' }}
                    />
                    <span>{account.name}</span>
                  </div>
                  {selectedId === account.id && <Check className="h-4 w-4 ml-auto text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 