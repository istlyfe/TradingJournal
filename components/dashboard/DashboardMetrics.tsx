"use client";

import { useState, useEffect } from "react";
import { BarChart, DollarSign, TrendingUp, TrendingDown, PieChart, Calendar, Clock, ArrowUpRight, ArrowDownRight, Percent, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { Account } from "@/types/account";
import { subWeeks, subMonths, subYears, isAfter, isBefore, parseISO, differenceInMinutes, format } from 'date-fns';
import { useAccounts } from "@/hooks/useAccounts";
import { ACCOUNT_SELECTION_CHANGE } from "@/components/accounts/AccountFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to get date ranges
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // This week (Sunday to Saturday)
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  // This month
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Three months ago
  const threeMonths = new Date(today);
  threeMonths.setMonth(today.getMonth() - 3);
  
  // Year to date
  const yearToDate = new Date(today.getFullYear(), 0, 1);
  
  return {
    thisWeek,
    thisMonth,
    threeMonths,
    yearToDate
  };
}

export function DashboardMetrics() {
  const [timePeriod, setTimePeriod] = useState<"thisWeek" | "thisMonth" | "threeMonths" | "yearToDate">("thisMonth");
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [dateRange, setDateRange] = useState<DateRange>('1M');
  const { selectedAccounts } = useAccounts();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Load trades
  useEffect(() => {
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      setTrades(JSON.parse(storedTrades));
    }
  }, []);
  
  useEffect(() => {
    const handleAccountSelectionChange = () => {
      // Force a re-render to update filtered trades
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener(
      ACCOUNT_SELECTION_CHANGE, 
      handleAccountSelectionChange
    );
    
    return () => {
      window.removeEventListener(
        ACCOUNT_SELECTION_CHANGE, 
        handleAccountSelectionChange
      );
    };
  }, []);
  
  const dateRanges = getDateRanges();
  
  // Filter trades by date range and selected accounts
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '1W':
        startDate = subWeeks(now, 1);
        break;
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      case 'ALL':
      default:
        startDate = new Date(0); // Beginning of time
    }

    // If no accounts are selected, return empty array
    if (selectedAccounts.length === 0) {
      return [];
    }

    return Object.values(trades).filter(trade => {
      const tradeDate = parseISO(trade.exitDate || trade.entryDate);
      const dateInRange = isAfter(tradeDate, startDate) && isBefore(tradeDate, now);
      // Only include trades from selected accounts
      const accountSelected = selectedAccounts.includes(trade.accountId);
      return dateInRange && accountSelected;
    });
  };

  // Calculate metrics for filtered trades
  const calculateMetrics = () => {
    const filteredTrades = getFilteredTrades();
    
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = filteredTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const winRate = filteredTrades.length > 0 
      ? (winningTrades.length / filteredTrades.length) * 100 
      : 0;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)) / losingTrades.length
      : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate average trade duration
    const tradesWithDuration = filteredTrades.filter(trade => trade.exitDate && trade.entryDate);
    const totalDuration = tradesWithDuration.reduce((sum, trade) => {
      const duration = differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
      return sum + duration;
    }, 0);
    const avgDuration = tradesWithDuration.length > 0 ? totalDuration / tradesWithDuration.length : 0;

    return {
      totalPnL,
      winRate,
      totalTrades: filteredTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin,
      avgLoss,
      profitFactor,
      avgDuration
    };
  };

  const metrics = calculateMetrics();
  
  // Group trades by symbol
  const tradesBySymbol: Record<string, Trade[]> = {};
  getFilteredTrades().forEach(trade => {
    if (!tradesBySymbol[trade.symbol]) {
      tradesBySymbol[trade.symbol] = [];
    }
    tradesBySymbol[trade.symbol].push(trade);
  });
  
  // Calculate P&L by symbol
  const pnlBySymbol: Record<string, number> = {};
  Object.entries(tradesBySymbol).forEach(([symbol, trades]) => {
    pnlBySymbol[symbol] = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  });
  
  // Calculate average duration by symbol
  const durationBySymbol: Record<string, { avgMinutes: number; count: number }> = {};
  Object.entries(tradesBySymbol).forEach(([symbol, trades]) => {
    const tradesWithDuration = trades.filter(trade => trade.exitDate && trade.entryDate);
    const totalDuration = tradesWithDuration.reduce((sum, trade) => {
      return sum + differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
    }, 0);
    
    durationBySymbol[symbol] = {
      avgMinutes: tradesWithDuration.length > 0 ? totalDuration / tradesWithDuration.length : 0,
      count: tradesWithDuration.length
    };
  });

  // Format duration helper
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.round((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  // Calculate daily P&L for chart
  const getDailyPnL = () => {
    const dailyPnL: Record<string, number> = {};
    const filteredTrades = getFilteredTrades();
    
    filteredTrades.forEach(trade => {
      const date = format(parseISO(trade.exitDate || trade.entryDate), 'yyyy-MM-dd');
      if (!dailyPnL[date]) {
        dailyPnL[date] = 0;
      }
      dailyPnL[date] += trade.pnl || 0;
    });

    return dailyPnL;
  };

  // Calculate additional metrics
  const calculateAdditionalMetrics = () => {
    const filteredTrades = getFilteredTrades();
    
    // Largest win and loss
    const largestWin = Math.max(...filteredTrades.map(t => t.pnl || 0));
    const largestLoss = Math.min(...filteredTrades.map(t => t.pnl || 0));
    
    // Average trade size
    const avgSize = filteredTrades.length > 0
      ? filteredTrades.reduce((sum, t) => sum + (t.quantity || 0), 0) / filteredTrades.length
      : 0;
    
    // Consecutive wins/losses
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    filteredTrades.forEach((trade, i) => {
      if (i === 0) {
        currentStreak = trade.pnl && trade.pnl > 0 ? 1 : -1;
      } else {
        if (trade.pnl && trade.pnl > 0) {
          if (currentStreak > 0) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        } else {
          if (currentStreak < 0) {
            currentStreak--;
          } else {
            currentStreak = -1;
          }
        }
      }
      
      if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
      if (currentStreak < maxLossStreak) maxLossStreak = Math.abs(currentStreak);
    });

    return {
      largestWin,
      largestLoss,
      avgSize,
      maxWinStreak,
      maxLossStreak
    };
  };

  const additionalMetrics = calculateAdditionalMetrics();
  const dailyPnL = getDailyPnL();
  
  return (
    <div className="space-y-4">
      {selectedAccounts.length === 0 && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No accounts selected. Select accounts using the account filter to view metrics.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col gap-4">
        <Tabs 
          defaultValue="thisMonth" 
          value={timePeriod}
          onValueChange={(value) => setTimePeriod(value as any)}
          className="w-full"
        >
          <TabsList className="w-full md:w-auto bg-background border">
            <TabsTrigger value="thisWeek">This Week</TabsTrigger>
            <TabsTrigger value="thisMonth">This Month</TabsTrigger>
            <TabsTrigger value="threeMonths">3 Months</TabsTrigger>
            <TabsTrigger value="yearToDate">YTD</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className={`h-4 w-4 ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(metrics.totalPnL)}
              </div>
              {metrics.totalPnL !== 0 && (
                <div className="flex items-center text-xs">
                  {metrics.totalPnL > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {metrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <div className="text-2xl font-bold">
                {metrics.winRate.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                ({metrics.winningTrades}/{metrics.totalTrades})
              </div>
            </div>
            <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${metrics.winRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.profitFactor.toFixed(2)}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Win: {formatCurrency(metrics.avgWin)}</span>
              <span>Loss: {formatCurrency(metrics.avgLoss)}</span>
            </div>
            <div className="mt-2 flex gap-1 h-1.5">
              <div className="flex-1 bg-green-500 rounded-l" />
              <div className="flex-1 bg-red-500 rounded-r" style={{ 
                flex: metrics.profitFactor > 0 ? 1 / metrics.profitFactor : 1 
              }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">
                {formatDuration(metrics.avgDuration)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per completed trade
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle>Trade Statistics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Largest Win</div>
                  <div className="text-xl font-bold text-green-500">{formatCurrency(additionalMetrics.largestWin)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Largest Loss</div>
                  <div className="text-xl font-bold text-red-500">{formatCurrency(additionalMetrics.largestLoss)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Win Streak</div>
                  <div className="text-xl font-bold">{additionalMetrics.maxWinStreak}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Loss Streak</div>
                  <div className="text-xl font-bold">{additionalMetrics.maxLossStreak}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle>Trading Activity</CardTitle>
            <CardDescription>Daily performance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {/* Add a chart component here to visualize daily P&L */}
              <div className="flex h-full items-end gap-2">
                {Object.entries(dailyPnL).slice(-14).map(([date, pnl]) => (
                  <div
                    key={date}
                    className="flex-1 relative group"
                    style={{ height: '100%' }}
                  >
                    <div
                      className={`absolute bottom-0 w-full transition-all ${
                        pnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                      style={{
                        height: `${Math.abs(pnl) / Math.max(...Object.values(dailyPnL).map(Math.abs)) * 100}%`,
                        minHeight: '1px'
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-background/90 text-xs px-2 py-1 rounded whitespace-nowrap">
                        {format(parseISO(date), 'MMM d')}: {formatCurrency(pnl)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P&L by Symbol */}
        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle>P&L by Symbol</CardTitle>
            <CardDescription>Performance breakdown by instrument</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(pnlBySymbol)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([symbol, pnl]) => (
                  <div key={symbol} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{symbol}</span>
                        <span className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                          {formatCurrency(pnl)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            pnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.abs(pnl) / Math.max(...Object.values(pnlBySymbol).map(Math.abs)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Average Duration by Symbol */}
        <Card className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle>Average Duration by Symbol</CardTitle>
            <CardDescription>How long trades are typically held</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(durationBySymbol)
                .sort(([, a], [, b]) => b.avgMinutes - a.avgMinutes)
                .map(([symbol, { avgMinutes, count }]) => (
                  <div key={symbol} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            ({count} trades)
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatDuration(avgMinutes)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500/50 transition-all duration-500"
                          style={{ 
                            width: `${(avgMinutes / Math.max(...Object.values(durationBySymbol).map(d => d.avgMinutes))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 