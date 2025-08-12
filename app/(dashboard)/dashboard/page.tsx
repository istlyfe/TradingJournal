"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { TradeCalendar } from "@/components/calendar/TradeCalendar";
import { MigrationBanner } from "@/components/dashboard/MigrationBanner";
import { Trade } from "@/types/trade";
import { useSession } from "next-auth/react";
import { useAccounts } from "@/hooks/useAccounts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { selectedAccounts } = useAccounts();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load trades from localStorage (will be replaced with API calls)
  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        const tradesData = JSON.parse(storedTrades);
        // Convert to array and filter by selected accounts
        const tradesArray = Object.values(tradesData) as Trade[];
        if (selectedAccounts.length > 0) {
          const filteredTrades = tradesArray.filter(trade => 
            trade.accountId && selectedAccounts.includes(trade.accountId)
          );
          setTrades(filteredTrades);
        } else {
          setTrades(tradesArray);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading trades:", error);
      setIsLoading(false);
    }
  }, [selectedAccounts]);

  // Listen for account selection changes
  useEffect(() => {
    const handleAccountChange = () => {
      // Reload trades when account selection changes
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        const tradesData = JSON.parse(storedTrades);
        const tradesArray = Object.values(tradesData) as Trade[];
        if (selectedAccounts.length > 0) {
          const filteredTrades = tradesArray.filter(trade => 
            trade.accountId && selectedAccounts.includes(trade.accountId)
          );
          setTrades(filteredTrades);
        } else {
          setTrades(tradesArray);
        }
      }
    };

    window.addEventListener('storage', handleAccountChange);
    return () => window.removeEventListener('storage', handleAccountChange);
  }, [selectedAccounts]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Migration Banner */}
      <MigrationBanner />
      
      {/* Performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Your key trading metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardMetrics trades={trades} />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Trades and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              Your most recent trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTrades />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trading Calendar</CardTitle>
            <CardDescription>
              Your trading activity by date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TradeCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 