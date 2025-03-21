"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { TradeCalendar } from "@/components/calendar/TradeCalendar";
import { TradeType } from "@/types/trade";

export default function DashboardPage() {
  const [trades, setTrades] = useState<Record<string, TradeType>>({});

  // Load trades from localStorage
  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        setTrades(JSON.parse(storedTrades));
      }
    } catch (error) {
      console.error("Error loading trades:", error);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
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
            <DashboardMetrics />
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