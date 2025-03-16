const fs = require('fs');
const path = require('path');

// Function to ensure directory exists
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Creating directory: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Function to copy file if it exists
function copyFileIfExists(source, destination) {
  if (fs.existsSync(source)) {
    console.log(`Copying ${source} to ${destination}`);
    const destDir = path.dirname(destination);
    ensureDirectoryExists(destDir);
    fs.copyFileSync(source, destination);
    return true;
  }
  return false;
}

// Function to write content to a file
function writeContentToFile(filePath, content) {
  console.log(`Writing content to file: ${filePath}`);
  const destDir = path.dirname(filePath);
  ensureDirectoryExists(destDir);
  fs.writeFileSync(filePath, content);
}

// Ensure critical directories exist - only lowercase versions
ensureDirectoryExists('components');
ensureDirectoryExists('components/ui');
ensureDirectoryExists('lib');
ensureDirectoryExists('hooks');

// Create card.tsx directly with minimal implementation
const cardContent = `import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props} />
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}`;

// Create tabs.tsx directly with minimal implementation
const tabsContent = `import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };`;

// Create utils.ts directly
const utilsContent = `export function cn(...inputs: (string | boolean | undefined | {[key: string]: boolean})[]): string {
  const classes = inputs.filter(Boolean);
  
  return classes
    .flatMap(cls => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function parseTradeDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch (e) {
    console.error("Error parsing date:", e);
    return new Date();
  }
}

export function isFuturesContract(symbol: string): boolean {
  if (!symbol) return false;
  
  // Common futures markers like /ES, /NQ, etc.
  if (symbol.startsWith('/')) return true;
  
  // Common futures suffixes
  const futuresSuffixes = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
  const lastChar = symbol.slice(-1).toUpperCase();
  const secondLastChar = symbol.slice(-2, -1);
  
  // If the last character is a number and second-to-last is a futures month code
  if (!isNaN(Number(lastChar)) && futuresSuffixes.includes(secondLastChar.toUpperCase())) {
    return true;
  }
  
  return false;
}

export function getFuturesContractMultiplier(symbol: string): number {
  if (!isFuturesContract(symbol)) return 1;
  
  // Common futures contract sizes
  const contractSizes: Record<string, number> = {
    '/ES': 50,    // E-mini S&P 500
    '/NQ': 20,    // E-mini Nasdaq 100
    '/YM': 5,     // E-mini Dow
    '/RTY': 50,   // E-mini Russell 2000
    '/CL': 1000,  // Crude Oil
    '/GC': 100,   // Gold
    '/SI': 5000,  // Silver
    '/ZB': 1000,  // US Treasury Bond
    '/ZN': 1000,  // 10-Year Treasury Note
    '/ZF': 1000,  // 5-Year Treasury Note
    '/ZT': 1000,  // 2-Year Treasury Note
    '/6E': 125000 // Euro FX
  };
  
  // Extract base symbol for matching
  const baseSymbol = symbol.split(' ')[0];
  
  return contractSizes[baseSymbol] || 1;
}`;

// Create useAccounts.ts directly
const useAccountsContent = `import { useState, useEffect } from 'react';

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
}`;

// Force create the files directly
writeContentToFile('components/ui/card.tsx', cardContent);
writeContentToFile('components/ui/tabs.tsx', tabsContent);
writeContentToFile('lib/utils.ts', utilsContent);
writeContentToFile('hooks/useAccounts.ts', useAccountsContent);

// Create a symlink for Components directory to handle case-sensitivity issues
console.log('Setting up case-sensitivity handling');
// Try to remove the Components directory if it exists
if (fs.existsSync('Components')) {
  try {
    fs.rmdirSync('Components', { recursive: true });
    console.log('Removed existing Components directory');
  } catch (e) {
    console.error('Error removing Components directory:', e);
  }
}

// On Linux/Unix systems, create a symlink
if (process.platform === 'linux' || process.platform === 'darwin') {
  try {
    fs.symlinkSync('components', 'Components', 'dir');
    console.log('Created symlink: Components -> components');
  } catch (e) {
    console.error('Error creating symlink:', e);
  }
}

console.log('Path fixing completed.'); 