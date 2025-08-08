"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrades } from "@/hooks/useTrades";
import { useAccounts } from "@/hooks/useAccounts";
import {
  LineChart,
  BarChart,
  DonutChart,
  AreaChart
} from "@/components/charts";
import { calculateMetrics } from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Clock,
  BarChart2,
  PieChart,
  Activity
} from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { trades } = useTrades();
  const { selectedAccounts, accounts } = useAccounts();
  const [timeframe, setTimeframe] = useState("all");

  // Handle no accounts state
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">No Trading Accounts</h2>
          <p className="text-muted-foreground">
            Create a trading account to start tracking your performance
          </p>
          <Button asChild>
            <Link href="/accounts">Create Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Handle no selected accounts state
  if (selectedAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">No Account Selected</h2>
          <p className="text-muted-foreground">
            Please select an account to view analytics
          </p>
          <Button asChild>
            <Link href="/accounts">Select Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate metrics only if we have trades
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4">
          <TrendingUp className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">No Trades Yet</h2>
          <p className="text-muted-foreground">
            Start adding trades to see your analytics
          </p>
          <Button asChild>
            <Link href="/trades/new">Add Trade</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const metrics = calculateMetrics(trades, selectedAccounts);

  return (
    <div className="space-y-8 p-6">
      {/* Header with Timeframe Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your trading performance</p>
        </div>
        <Tabs defaultValue="all" onValueChange={setTimeframe}>
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net P&L</p>
              <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${metrics.netProfit.toFixed(2)}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${metrics.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</p>
            </div>
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-500">{metrics.maxDrawdown.toFixed(2)}%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cumulative P&L</h3>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <AreaChart
            data={metrics.monthlyPnL}
            className="h-[300px]"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Win vs. Loss Distribution</h3>
            <PieChart className="w-5 h-5 text-muted-foreground" />
          </div>
          <DonutChart
            data={[
              { name: "Wins", value: metrics.winRate },
              { name: "Losses", value: 100 - metrics.winRate }
            ]}
          />
        </Card>
      </div>

      {/* Trading Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Best Trading Times</h3>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">By Day</h4>
              <div className="space-y-2">
                {metrics.bestTradingDays.slice(0, 5).map((day, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{day.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{day.winRate.toFixed(1)}%</span>
                      {day.winRate > 60 && <TrendingUp className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">By Hour</h4>
              <div className="space-y-2">
                {metrics.bestTradingHours.slice(0, 5).map((hour, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{hour.time}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{hour.winRate.toFixed(1)}%</span>
                      {hour.winRate > 60 && <TrendingUp className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Setup Performance</h3>
            <BarChart2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <BarChart
            data={metrics.setupPerformance}
            className="h-[300px]"
          />
        </Card>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Position Sizing</h3>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </div>
          <BarChart
            data={metrics.positionSizes}
            className="h-[300px]"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Drawdown History</h3>
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
          </div>
          <AreaChart
            data={metrics.drawdownHistory}
            className="h-[300px]"
          />
        </Card>
      </div>

      {/* Psychological Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trading Mood Impact</h3>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <BarChart
            data={metrics.moodPerformance}
            className="h-[300px]"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Consistency Score</h3>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <LineChart
            data={metrics.consistencyScore}
            className="h-[300px]"
          />
        </Card>
      </div>
    </div>
  );
} 