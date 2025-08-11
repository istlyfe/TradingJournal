'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Plus, 
  Settings, 
  User, 
  HelpCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import { Checkbox } from '@/components/ui/checkbox';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { accounts, selectedAccounts, setSelectedAccounts, toggleAccount } = useAccounts();

  // Listen for scroll to add shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for account creation events
  useEffect(() => {
    const handleStorageChange = () => {
      // Force a refresh of this component
      setRefreshKey(prev => prev + 1);
      // Briefly open dropdown to show the new account
      setDropdownOpen(true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleAllAccounts = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map(account => account.id));
    }
  };

  const getSelectedAccountColor = () => {
    if (selectedAccounts.length === 1) {
      const account = accounts.find(a => a.id === selectedAccounts[0]);
      return account?.color || '#7C3AED';
    }
    return '#7C3AED';
  };

  const getUserInitials = () => {
    const name = session?.user?.name || session?.user?.email || 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handler for when dialog closes
  const handleAddDialogChange = (open: boolean) => {
    setAddDialogOpen(open);
    // If dialog is closing, check accounts again
    if (!open) {
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-sm ${
        scrolled ? 'border-b shadow-md' : ''
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Image src="/logo.svg" alt="Trading Journal" width={24} height={24} priority />
            </div>
            <span className="hidden font-bold sm:inline-block text-xl">Trading Journal</span>
          </Link>
        </div>

        {/* Account Selection & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Custom Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center h-7 px-2 py-1 rounded-md bg-black/90 border border-indigo-900/60 cursor-pointer hover:bg-black shadow-sm transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div 
                className="h-3 w-3 rounded-[2px]" 
                style={{ backgroundColor: getSelectedAccountColor() }} 
              />
              <span className="mx-1.5 text-xs font-medium text-white/90 max-w-[100px] truncate">
                {selectedAccounts.length > 0
                  ? selectedAccounts.length === 1
                    ? accounts.find(a => a.id === selectedAccounts[0])?.name || 'Account'
                    : `${selectedAccounts.length} Accounts`
                  : 'All Accounts'}
              </span>
              <ChevronDown className="h-3 w-3 text-indigo-300/70" />
            </div>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-800 bg-black/95 shadow-lg z-50 overflow-hidden backdrop-blur-sm">
                <div className="p-0.5">
                  {/* All accounts option */}
                  <div 
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-indigo-900/40 rounded-md cursor-pointer text-white text-opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllAccounts();
                    }}
                  >
                    <div className="flex items-center justify-center h-3.5 w-3.5">
                      <Checkbox 
                        checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                        className="rounded-[2px] border-gray-600 h-3 w-3"
                      />
                    </div>
                    <span className="ml-1.5 text-xs font-medium">All accounts</span>
                  </div>
                  
                  <div className="mt-1 border-t border-gray-800/60 pt-1">
                    <div className="px-2.5 py-0.5 text-[10px] text-indigo-300/70 font-medium uppercase tracking-wider">
                      My accounts
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto py-0.5 scrollbar-thin">
                      {accounts.map(account => (
                        <div 
                          key={`${account.id}-${refreshKey}`}
                          className="flex items-center gap-2 mx-0.5 px-2 py-1.5 hover:bg-indigo-900/40 rounded-md cursor-pointer text-white text-opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAccount(account.id);
                          }}
                        >
                          <div className="flex items-center justify-center h-3.5 w-3.5">
                            <Checkbox 
                              checked={selectedAccounts.includes(account.id)}
                              className="rounded-[2px] border-gray-600 h-3 w-3"
                            />
                          </div>
                          <span className="ml-1.5 text-xs font-medium truncate">{account.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Add Account Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="icon"
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-sm h-7 w-7 flex items-center justify-center rounded-md border border-indigo-500"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span className="sr-only">Add account</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Create new account
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Add Account Dialog */}
          <AddAccountDialog 
            open={addDialogOpen} 
            onOpenChange={handleAddDialogChange} 
          />
          
          {/* Help Menu */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Help & Resources
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name || 'Signed in'}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 