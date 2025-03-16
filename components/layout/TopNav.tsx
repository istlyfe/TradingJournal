"use client";

import { AccountsPanel } from "@/components/accounts/AccountsPanel";

export function TopNav() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div></div> {/* Empty div for spacing */}
        <div className="flex items-center">
          <AccountsPanel />
        </div>
      </div>
    </nav>
  );
} 