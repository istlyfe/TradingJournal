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
  Check,
  Search,
  Bell,
  Home,
  BarChart3,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  FileText
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { accounts, selectedAccounts, setSelectedAccounts, toggleAccount } = useAccounts();

  // Navigation items for mobile menu
  const navigationItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/overview', icon: BarChart3, label: 'Overview' },
    { href: '/trades', icon: FileText, label: 'Trades' },
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/progress', icon: Target, label: 'Progress' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Listen for account creation events
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
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

  const handleAddDialogChange = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <>
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

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search trades, journal entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:border-primary focus:outline-none text-sm transition-colors"
                />
              </div>
            </form>
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
            
            {/* Notifications - Hidden on mobile */}
            <div className="hidden md:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                      <Bell className="h-4 w-4" />
                      <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Notifications
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Help Menu - Hidden on mobile */}
            <div className="hidden md:block">
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
            </div>
            
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

        {/* Mobile Search Bar */}
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
          <form onSubmit={handleSearch} className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search trades, journal entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r border-border shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Image src="/logo.svg" alt="Trading Journal" width={24} height={24} />
                  </div>
                  <span className="font-bold text-lg">Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session?.user?.name || 'Signed in'}</p>
                    <p className="text-sm text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAddDialogOpen(true);
                  }}
                >
                  <Plus className="mr-3 h-5 w-5" />
                  Add Account
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Dialog */}
      <AddAccountDialog 
        open={addDialogOpen} 
        onOpenChange={handleAddDialogChange} 
      />
    </>
  );
} 