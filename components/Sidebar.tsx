"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  LineChart,
  List,
  Settings,
  BookOpen,
  CreditCard,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart2,
  },
  {
    title: "Trades",
    href: "/trades",
    icon: List,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // Debug the current pathname
  console.log("Current pathname:", pathname);

  // Helper function to check if a path is active
  const isPathActive = (itemHref: string) => {
    // For dashboard path, only exact match
    if (itemHref === "/dashboard") {
      return pathname === "/dashboard";
    }
    
    // For other paths, check if pathname includes the href
    // This handles both exact matches and nested routes
    return pathname === itemHref || pathname.includes(itemHref + "/");
  };

  // Get initials from user name
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="default"
        size="icon"
        className="absolute -right-4 top-20 z-20 rounded-full border-0 shadow-md bg-black text-white h-8 w-8 p-0 hover:bg-black/90"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className={cn(
          "font-bold transition-all duration-300",
          isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
        )}>
          Trading Journal
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent group relative z-0",
              isPathActive(item.href) ? "bg-accent text-primary font-medium" : "text-muted-foreground",
              isCollapsed && "justify-center"
            )}
            onClick={(e) => {
              // Prevent default navigation if already on this page
              if (pathname === item.href) {
                e.preventDefault();
                return;
              }
              
              // Debug what's happening when a link is clicked
              console.log(`Navigating to: ${item.href}, current pathname: ${pathname}`);
            }}
          >
            <item.icon className={cn(
              "h-4 w-4 transition-colors",
              isPathActive(item.href) ? "text-primary" : "text-muted-foreground",
            )} />
            <span
              className={cn(
                "transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 absolute" : "w-full opacity-100 relative"
              )}
            >
              {item.title}
            </span>
            {isPathActive(item.href) && (
              <span className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full" />
            )}
          </Link>
        ))}
      </nav>
      
      {/* User menu at bottom */}
      <div className="mt-auto border-t p-4">
        <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full flex items-center justify-start gap-3 px-3 py-2 hover:bg-accent",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {session?.user ? getInitials(session.user.name || session.user.email || "") : "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {session?.user?.name || 'Signed in'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {session?.user?.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "start"} className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name || 'Signed in'}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
