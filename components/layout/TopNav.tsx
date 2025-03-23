"use client";

import { useState } from "react";
import { AccountsPanel } from "@/components/accounts/AccountsPanel";
import { AccountCreationModal } from "@/components/accounts/AccountCreationModal";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown,
  PlusCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopNav() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    router.push("/");
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

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 w-full">
      <div className="container flex h-16 items-center justify-between">
        <div>
          {user && (
            <span className="text-sm font-medium">
              <span className="text-muted-foreground mr-1">Logged in as</span> 
              {user.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Accounts Panel */}
          <div className="account-selector-topnav">
            <AccountsPanel />
          </div>
          
          {/* Add Account button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setShowAccountModal(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Account</span>
          </Button>
          
          {/* User menu - Will be moved to sidebar, but keeping for now */}
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-accent px-2 rounded-full h-9"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard")}>
                <User className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
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
      
      {/* Account Creation Modal */}
      <AccountCreationModal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        onCreateSuccess={(accountId) => {
          toast({
            title: "Account Created",
            description: "Your new account has been created successfully."
          });
        }}
      />
    </nav>
  );
} 