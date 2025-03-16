const fs = require('fs');
const path = require('path');

const UTILS_PATH = 'lib/utils.ts';
const CARD_PATH = 'components/ui/card.tsx';
const TABS_PATH = 'components/ui/tabs.tsx';
const ACCOUNTS_PATH = 'hooks/useAccounts.ts';

// Function to ensure directory exists
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Creating directory: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Function to create a file if it doesn't exist
function createFileIfNotExist(filePath, content) {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${filePath}`);
    const destDir = path.dirname(filePath);
    ensureDirectoryExists(destDir);
    fs.writeFileSync(filePath, content);
    return true;
  } else {
    console.log(`File exists: ${filePath}`);
    return false;
  }
}

// Function to append to a file only if it doesn't contain specific content
function appendFunctionsIfMissing(filePath, functions) {
  if (!fs.existsSync(filePath)) {
    console.log(`File doesn't exist: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for each function if it's already in the file
  const toAdd = [];
  for (const { name, implementation } of functions) {
    if (!content.includes(`export function ${name}`)) {
      console.log(`Adding missing function: ${name}`);
      toAdd.push(implementation);
    } else {
      console.log(`Function exists: ${name}`);
    }
  }

  // Append missing functions
  if (toAdd.length > 0) {
    fs.appendFileSync(filePath, '\n\n' + toAdd.join('\n\n'));
    return true;
  }
  
  return false;
}

// Create necessary directories
ensureDirectoryExists('components');
ensureDirectoryExists('components/ui');
ensureDirectoryExists('lib');
ensureDirectoryExists('hooks');

// Check and append missing utils functions
const utilsFunctions = [
  {
    name: 'formatDateTime',
    implementation: `export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}`
  },
  {
    name: 'parseTradeDate',
    implementation: `export function parseTradeDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch (e) {
    console.error("Error parsing date:", e);
    return new Date();
  }
}`
  },
  {
    name: 'isFuturesContract',
    implementation: `export function isFuturesContract(symbol: string): boolean {
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
}`
  },
  {
    name: 'getFuturesContractMultiplier',
    implementation: `export function getFuturesContractMultiplier(symbol: string): number {
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
}`
  }
];

// Check for minimal utils.ts
const minimalUtilsContent = `export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}`;

createFileIfNotExist(UTILS_PATH, minimalUtilsContent);
appendFunctionsIfMissing(UTILS_PATH, utilsFunctions);

// Check for other essential files
const cardContent = `import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={className}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={className}
      {...props}
    />
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={className}
      {...props}
    />
  );
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={className}
      {...props}
    />
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={className} {...props} />
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={className}
      {...props}
    />
  );
}`;

const tabsContent = `import * as React from "react";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsProps) {
  return <div className={className} {...props} />;
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return <div className={className} {...props} />;
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  className,
  value,
  ...props
}: TabsTriggerProps) {
  return <button className={className} {...props} />;
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  className,
  value,
  ...props
}: TabsContentProps) {
  return <div className={className} {...props} />;
}`;

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

createFileIfNotExist(CARD_PATH, cardContent);
createFileIfNotExist(TABS_PATH, tabsContent);
createFileIfNotExist(ACCOUNTS_PATH, useAccountsContent);

// Create both case variations for UI components
const upperCaseCardPath = CARD_PATH.replace('components', 'Components');
const upperCaseTabsPath = TABS_PATH.replace('components', 'Components');

ensureDirectoryExists('Components');
ensureDirectoryExists('Components/ui');
createFileIfNotExist(upperCaseCardPath, cardContent);
createFileIfNotExist(upperCaseTabsPath, tabsContent);

console.log('One-time fix completed.'); 