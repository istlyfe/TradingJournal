"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart2, LayoutDashboard, LineChart, Calendar, Settings, CreditCard, ArrowRight, ChevronDown, TrendingUp, DollarSign, Target, Clock, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from 'next/image';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    async function checkAuth() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.isAuthenticated) {
            setIsAuthenticated(true);
            // If authenticated, redirect to dashboard
            router.push('/dashboard');
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin mr-3 h-8 w-8 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // If not authenticated, show the landing page
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Image 
                src="/logo.svg" 
                alt="Trading Journal Logo" 
                width={48} 
                height={48} 
                className="w-12 h-12" 
              />
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Trading Journal
            </h1>
            
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Track your trades, analyze your performance, and become a better trader.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                <Link href="/login" className="px-8">
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">
                  Create Account
                </Link>
              </Button>
            </div>
            
            <p className="text-sm mt-4 text-muted-foreground">
              Want to try it first?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary hover:underline font-medium"
                onClick={async () => {
                  try {
                    // Button press indicator
                    alert("Trying to log in with demo account... Please wait.");
                    
                    const response = await fetch('/api/auth/demo', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                      // Success - redirect to dashboard
                      alert("Demo login successful! Redirecting to dashboard...");
                      window.location.href = '/dashboard';
                    } else {
                      // Show detailed error message
                      console.error('Demo login failed:', data);
                      alert(`Failed to login with demo account: ${data.message || 'Unknown error'}\n${data.error || ''}`);
                    }
                  } catch (error) {
                    // More detailed error handling
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('Demo login error:', error);
                    alert(`Error connecting to the server: ${errorMessage}`);
                  }
                }}
              >
                Use our demo
              </Button>
            </p>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="w-full py-12 md:py-24 bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card shadow-sm">
              <div className="p-2 bg-primary/10 rounded-full">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Track Your Trades</h3>
              <p className="text-sm text-center text-muted-foreground">
                Log your entries, exits, and performance metrics for every trade.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card shadow-sm">
              <div className="p-2 bg-primary/10 rounded-full">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 3v18h18" />
                  <path d="m3 9 4 4 8-8 4 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Analyze Performance</h3>
              <p className="text-sm text-center text-muted-foreground">
                Get insights with detailed analytics and performance metrics.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card shadow-sm">
              <div className="p-2 bg-primary/10 rounded-full">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Journal Your Thoughts</h3>
              <p className="text-sm text-center text-muted-foreground">
                Record your trading psychology and learn from your experiences.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.svg" 
                alt="Trading Journal Logo" 
                width={24} 
                height={24} 
              />
              <span className="font-semibold">Trading Journal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Trading Journal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
