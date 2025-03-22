"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "@/components/ui/custom-styles.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeStyles } from "@/components/theme/theme-styles";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Track your trading performance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Check authentication and navigate if needed
    const checkAuth = () => {
      // If auth check is complete and user is not authenticated, redirect
      if (!isLoading && !isAuthenticated) {
        router.push("/login");
      } else if (!isLoading) {
        // Auth check is complete and user is authenticated
        setChecking(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes (like logout from other tabs)
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading || checking) {
    return (
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex h-screen w-screen items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your dashboard...</p>
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Don't render anything if not authenticated (redirect should happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          [role="checkbox"] {
            width: 16px !important;
            height: 16px !important;
            min-width: 16px !important;
            min-height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
            aspect-ratio: 1/1 !important;
            border-width: 1px !important;
            border-radius: 3px !important;
            padding: 0 !important;
          }
          
          [role="checkbox"] svg {
            width: 12px !important;
            height: 12px !important;
            min-width: 12px !important;
            min-height: 12px !important;
            max-width: 12px !important;
            max-height: 12px !important;
          }
        `}} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemeStyles />
          <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <TopNav />
              <main className="flex-1 overflow-y-auto">
                <div className="p-6 w-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
} 