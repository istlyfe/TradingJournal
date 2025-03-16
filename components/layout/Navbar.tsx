"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, User } from "lucide-react";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b sticky top-0 bg-background z-10 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2 flex-1 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none focus:outline-none text-sm flex-1" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6 ml-4">
          <button className="relative hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </button>
          <button className="flex items-center justify-center h-9 w-9 rounded-full bg-muted hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
