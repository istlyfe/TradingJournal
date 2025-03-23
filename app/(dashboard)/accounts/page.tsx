"use client";

import { AccountManager } from "@/components/accounts/AccountManager";
import { CreditCard } from "lucide-react";

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Account Management</h1>
      </div>
      
      <p className="text-muted-foreground">
        Manage your trading accounts to track performance across different platforms and strategies.
      </p>
      
      <div className="mt-4">
        <AccountManager />
      </div>
    </div>
  );
} 