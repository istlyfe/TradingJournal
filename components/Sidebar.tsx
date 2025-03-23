'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  LineChart, 
  Wallet, 
  Settings, 
  ChevronsLeft, 
  ChevronsRight, 
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Trades',
    href: '/trades',
    icon: TrendingUp,
  },
  {
    title: 'Journal',
    href: '/journal',
    icon: BookOpen,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: LineChart,
  },
  {
    title: 'Accounts',
    href: '/accounts',
    icon: Wallet,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  
  // Get accounts from user for the accounts dropdown
  const accounts = user?.accounts || [];

  return (
    <div
      className={cn(
        'flex-col border-r bg-card h-[calc(100vh-4rem)] hidden md:flex transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Main Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className="px-3 py-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className={cn("px-4 text-lg font-semibold tracking-tight", collapsed && "hidden")}>
                Navigation
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-7 w-7"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                
                return collapsed ? (
                  <TooltipProvider key={item.href} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-md',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="sr-only">{item.title}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="border bg-card text-card-foreground">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Accounts Section */}
          {!collapsed && (
            <div className="px-3 py-2 mt-6">
              <h3 className="mb-2 px-4 text-sm font-semibold">Accounts</h3>
              <div className="space-y-1">
                {accounts.map((account) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                      pathname === `/accounts/${account.id}`
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: account.color || '#7C3AED' }}
                    />
                    <span className="truncate">{account.name}</span>
                  </Link>
                ))}
                
                <Link
                  href="/accounts/new"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </Link>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Quick Add Button */}
        <div className="p-3 mt-auto">
          <Button className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            {!collapsed && <span>Add Trade</span>}
          </Button>
        </div>
      </div>
    </div>
  );
} 