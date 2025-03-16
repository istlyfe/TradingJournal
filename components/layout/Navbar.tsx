"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, Settings, User } from "lucide-react";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none focus:outline-none text-sm flex-1" 
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
          </button>
          <button className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
