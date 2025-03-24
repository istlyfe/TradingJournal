'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  LineChart, 
  Settings,
  ChevronsLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    title: 'Progress',
    href: '/progress',
    icon: Trophy,
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

  // Toggle sidebar state
  const toggleSidebar = () => {
    // Get the main content element
    const mainContent = document.querySelector('main');
    if (mainContent) {
      // If collapsing, remove previous margin and add small margin
      if (!collapsed) {
        mainContent.classList.remove('md:ml-64');
        mainContent.classList.add('md:ml-16');
      } else {
        // If expanding, remove small margin and add large margin
        mainContent.classList.remove('md:ml-16');
        mainContent.classList.add('md:ml-64');
      }
    }
    // Toggle state
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-gradient-to-b from-background to-background/80 hidden md:block transition-all duration-300 z-30 overflow-y-auto",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="relative px-3 py-4">
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "absolute top-2 -right-3 h-6 w-6 rounded-full border shadow-sm bg-background z-10",
              collapsed ? "-right-3" : "-right-3"
            )}
          >
            {collapsed ? 
              <ChevronRight className="h-3 w-3" /> : 
              <ChevronsLeft className="h-3 w-3" />
            }
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          {/* Navigation Items */}
          <div className="space-y-2 mt-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return collapsed ? (
                <TooltipProvider key={item.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
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
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/50"></div>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
} 