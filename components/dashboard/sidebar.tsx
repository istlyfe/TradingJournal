"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  LineChart, 
  TrendingUp,
  Wallet,
  BookOpen,
  Settings,
  Plus,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const mainNavItems: SidebarNavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard/overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: 'Trades',
    href: '/dashboard/trades',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    title: 'Accounts',
    href: '/dashboard/accounts',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: <LineChart className="w-5 h-5" />,
  },
  {
    title: 'Journal',
    href: '/dashboard/journal',
    icon: <BookOpen className="w-5 h-5" />,
  },
];

const secondaryNavItems: SidebarNavItem[] = [
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <ScrollArea className="flex-1 pt-4">
        <div className="px-4 py-2">
          <h2 className="px-2 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="mt-3 space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="px-6 py-4">
          <Button className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Trade
          </Button>
        </div>
        <div className="px-4 py-2">
          <h2 className="px-2 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="mt-3 space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Team Plan</p>
            <p className="text-xs text-muted-foreground">
              2 members
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
} 