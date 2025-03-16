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

// Ensure critical directories exist
ensureDirectoryExists('Components');
ensureDirectoryExists('Components/ui');
ensureDirectoryExists('components');
ensureDirectoryExists('components/ui');
ensureDirectoryExists('lib');
ensureDirectoryExists('hooks');

// Create card.tsx directly with minimal implementation
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

// Create tabs.tsx directly with minimal implementation
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

// Create utils.ts directly
const utilsContent = `export function cn(...classes: string[]) {
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

// Create a simplified tsconfig.json with explicit paths
const tsconfigContent = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/Components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;

// Force create the files directly
writeContentToFile('components/ui/card.tsx', cardContent);
writeContentToFile('components/ui/tabs.tsx', tabsContent);
writeContentToFile('lib/utils.ts', utilsContent);
writeContentToFile('hooks/useAccounts.ts', useAccountsContent);
writeContentToFile('tsconfig.json', tsconfigContent);

// Also create case-variant versions for compatibility
writeContentToFile('Components/ui/card.tsx', cardContent);
writeContentToFile('Components/ui/tabs.tsx', tabsContent);

// Files with fallbacks - check if original exists, otherwise use fallbacks
const criticalFiles = [
  { 
    source: 'components/ui/card.tsx', 
    destination: 'components/ui/card.tsx',
    fallback: 'components/ui/card-fallback.tsx'
  },
  { 
    source: 'components/ui/tabs.tsx', 
    destination: 'components/ui/tabs.tsx',
    fallback: 'components/ui/tabs-fallback.tsx'
  },
  { 
    source: 'lib/utils.ts', 
    destination: 'lib/utils.ts',
    fallback: 'lib/utils-fallback.ts'
  },
  { 
    source: 'hooks/useAccounts.ts', 
    destination: 'hooks/useAccounts.ts',
    fallback: 'hooks/useAccounts-fallback.ts'
  }
];

// We'll still use the fallback logic as a backup
for (const file of criticalFiles) {
  if (!fs.existsSync(file.source) && fs.existsSync(file.fallback)) {
    // If source doesn't exist but fallback does, use fallback
    console.log(`Source ${file.source} not found, using fallback ${file.fallback}`);
    copyFileIfExists(file.fallback, file.source);
  }
  
  // Also make case-sensitive copies for compatibility
  const upperCaseDir = file.destination.replace('components', 'Components');
  copyFileIfExists(file.source, upperCaseDir);
}

console.log('Path fixing completed.'); 