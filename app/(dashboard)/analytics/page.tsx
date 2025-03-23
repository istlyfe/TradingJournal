"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Calendar, Clock, ArrowRight } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "@/hooks/useAccounts";
import { differenceInMinutes, parseISO, format, isAfter, isBefore, subDays, subMonths, subYears } from "date-fns";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import AdvancedMetrics from "@/components/analytics/AdvancedMetrics";
import TradePatternAnalysis from "@/components/analytics/TradePatternAnalysis";
import RiskManagementAnalysis from "@/components/analytics/RiskManagementAnalysis";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const PROFIT_COLOR = '#10b981'; // Green
const LOSS_COLOR = '#ef4444';   // Red

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("30d");
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const { selectedAccounts } = useAccounts();
  const [isLoading, setIsLoading] = useState(true);
  
  // Load trades from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        setTrades(JSON.parse(storedTrades));
      }
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Filter trades by timeframe and selected accounts
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;
    
    // Set date range based on selected timeframe
    switch (timeframe) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      case "1y":
        startDate = subYears(now, 1);
        break;
      case "all":
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    return Object.values(trades).filter((trade) => {
      const entryDate = parseISO(trade.entryDate);
      // Filter by date and selected accounts
      return isAfter(entryDate, startDate) && 
             (selectedAccounts.length === 0 || selectedAccounts.includes(trade.account));
    });
  };
  
  // Calculate key metrics from filtered trades
  const calculateMetrics = () => {
    const filteredTrades = getFilteredTrades();
    
    // Initialize metrics
    let totalPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;
    let largestWin = 0;
    let largestLoss = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let totalTradeCount = filteredTrades.length;
    let longCount = 0;
    let shortCount = 0;
    let longPnL = 0;
    let shortPnL = 0;
    let totalDuration = 0;
    let tradesWithDuration = 0;
    
    // Process each trade
    filteredTrades.forEach((trade) => {
      const pnl = trade.pnl || 0;
      totalPnL += pnl;
      
      // Count wins and losses
      if (pnl > 0) {
        winCount++;
        totalWinAmount += pnl;
        largestWin = Math.max(largestWin, pnl);
      } else if (pnl < 0) {
        lossCount++;
        totalLossAmount += Math.abs(pnl);
        largestLoss = Math.min(largestLoss, pnl);
      } else {
        breakEvenCount++;
      }
      
      // Long vs Short stats
      if (trade.direction === 'long') {
        longCount++;
        longPnL += pnl;
      } else if (trade.direction === 'short') {
        shortCount++;
        shortPnL += pnl;
      }
      
      // Calculate trade duration if possible
      if (trade.entryDate && trade.exitDate) {
        const entryDate = parseISO(trade.entryDate);
        const exitDate = parseISO(trade.exitDate);
        
        if (isAfter(exitDate, entryDate)) {
          const durationMinutes = differenceInMinutes(exitDate, entryDate);
          totalDuration += durationMinutes;
          tradesWithDuration++;
        }
      }
    });
    
    // Calculate derived metrics
    const winRate = totalTradeCount > 0 ? (winCount / totalTradeCount) * 100 : 0;
    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;
    const avgDuration = tradesWithDuration > 0 ? totalDuration / tradesWithDuration : 0;
    const expectancy = winRate > 0 ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss : 0;
    
    return {
      totalPnL,
      totalTradeCount,
      winCount,
      lossCount,
      breakEvenCount,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      longCount,
      shortCount,
      longPnL,
      shortPnL,
      avgDuration,
      expectancy
    };
  };
  
  // Format time duration from minutes to readable format
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) { // Less than a day
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d${hours > 0 ? ` ${hours}h` : ''}`;
    }
  };
  
  // Get cumulative P&L data for the chart
  const getCumulativePnLData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Sort trades by date
    const sortedTrades = [...filteredTrades].sort((a, b) => {
      return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    });
    
    let cumulativePnL = 0;
    return sortedTrades.map((trade) => {
      cumulativePnL += (trade.pnl || 0);
      return {
        date: format(parseISO(trade.entryDate), 'MM/dd'),
        pnl: cumulativePnL
      };
    });
  };
  
  // Get P&L distribution data for the chart
  const getPnLDistributionData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Create buckets for P&L values
    const distribution: Record<string, number> = {};
    
    filteredTrades.forEach((trade) => {
      const pnl = trade.pnl || 0;
      
      // Round to nearest $50 for bucketing
      let bucket: string;
      if (pnl >= 1000) {
        bucket = "$1000+";
      } else if (pnl <= -1000) {
        bucket = "-$1000+";
      } else {
        const rounded = Math.round(pnl / 50) * 50;
        bucket = formatCurrency(rounded);
      }
      
      if (distribution[bucket]) {
        distribution[bucket]++;
      } else {
        distribution[bucket] = 1;
      }
    });
    
    // Convert to array and sort by P&L value
    return Object.entries(distribution)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aValue = parseFloat(a.range.replace(/[^0-9.-]+/g, ""));
        const bValue = parseFloat(b.range.replace(/[^0-9.-]+/g, ""));
        return aValue - bValue;
      });
  };
  
  // Get symbol performance data
  const getSymbolPerformance = () => {
    const filteredTrades = getFilteredTrades();
    
    // Group trades by symbol and calculate metrics
    const symbolPerformance: Record<string, { count: number, pnl: number, winCount: number }> = {};
    
    filteredTrades.forEach((trade) => {
      const symbol = trade.symbol;
      const pnl = trade.pnl || 0;
      
      if (!symbolPerformance[symbol]) {
        symbolPerformance[symbol] = { count: 0, pnl: 0, winCount: 0 };
      }
      
      symbolPerformance[symbol].count++;
      symbolPerformance[symbol].pnl += pnl;
      
      if (pnl > 0) {
        symbolPerformance[symbol].winCount++;
      }
    });
    
    // Convert to array and sort by P&L
    return Object.entries(symbolPerformance)
      .map(([symbol, data]) => ({
        symbol,
        count: data.count,
        pnl: data.pnl,
        winRate: data.count > 0 ? (data.winCount / data.count) * 100 : 0
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10); // Top 10 symbols
  };
  
  // Get day of week performance data
  const getDayOfWeekPerformance = () => {
    const filteredTrades = getFilteredTrades();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Initialize data for all days of the week
    const dayPerformance = daysOfWeek.reduce((acc, day) => {
      acc[day] = { count: 0, pnl: 0, winCount: 0 };
      return acc;
    }, {} as Record<string, { count: number, pnl: number, winCount: number }>);
    
    // Populate with actual data
    filteredTrades.forEach((trade) => {
      const entryDate = parseISO(trade.entryDate);
      const dayOfWeek = daysOfWeek[entryDate.getDay()];
      const pnl = trade.pnl || 0;
      
      dayPerformance[dayOfWeek].count++;
      dayPerformance[dayOfWeek].pnl += pnl;
      
      if (pnl > 0) {
        dayPerformance[dayOfWeek].winCount++;
      }
    });
    
    // Convert to array format for charts
    return daysOfWeek
      .filter(day => dayPerformance[day].count > 0) // Only include days with trades
      .map(day => ({
        day,
        count: dayPerformance[day].count,
        pnl: dayPerformance[day].pnl,
        winRate: dayPerformance[day].count > 0 
          ? (dayPerformance[day].winCount / dayPerformance[day].count) * 100 
          : 0
      }));
  };
  
  // Get trade duration data for analysis
  const getTradeDurationData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Define duration buckets (in minutes)
    const buckets = [
      { name: "< 5m", min: 0, max: 5 },
      { name: "5-15m", min: 5, max: 15 },
      { name: "15-30m", min: 15, max: 30 },
      { name: "30-60m", min: 30, max: 60 },
      { name: "1-4h", min: 60, max: 240 },
      { name: "4-8h", min: 240, max: 480 },
      { name: "> 8h", min: 480, max: Infinity }
    ];
    
    // Initialize buckets
    const durationData = buckets.reduce((acc, bucket) => {
      acc[bucket.name] = { count: 0, pnl: 0, winCount: 0 };
      return acc;
    }, {} as Record<string, { count: number, pnl: number, winCount: number }>);
    
    // Categorize trades by duration
    filteredTrades.forEach((trade) => {
      if (trade.entryDate && trade.exitDate) {
        const entryDate = parseISO(trade.entryDate);
        const exitDate = parseISO(trade.exitDate);
        
        if (isAfter(exitDate, entryDate)) {
          const durationMinutes = differenceInMinutes(exitDate, entryDate);
          const pnl = trade.pnl || 0;
          
          // Find appropriate bucket
          const bucket = buckets.find(b => 
            durationMinutes >= b.min && durationMinutes < b.max
          );
          
          if (bucket) {
            durationData[bucket.name].count++;
            durationData[bucket.name].pnl += pnl;
            
            if (pnl > 0) {
              durationData[bucket.name].winCount++;
            }
          }
        }
      }
    });
    
    // Convert to array format for charts
    return buckets
      .filter(bucket => durationData[bucket.name].count > 0) // Only include buckets with trades
      .map(bucket => ({
        duration: bucket.name,
        count: durationData[bucket.name].count,
        pnl: durationData[bucket.name].pnl,
        avgPnl: durationData[bucket.name].count > 0 
          ? durationData[bucket.name].pnl / durationData[bucket.name].count 
          : 0,
        winRate: durationData[bucket.name].count > 0 
          ? (durationData[bucket.name].winCount / durationData[bucket.name].count) * 100 
          : 0
      }));
  };
  
  // Get metrics for display
  const metrics = calculateMetrics();
  
  // Get chart data
  const cumulativePnLData = getCumulativePnLData();
  const pnlDistributionData = getPnLDistributionData();
  const symbolPerformanceData = getSymbolPerformance();
  const dayOfWeekData = getDayOfWeekPerformance();
  const durationData = getTradeDurationData();
  
  // Handle the case of no trades
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading your trading data...</p>
        </div>
      </div>
    );
  }
  
  if (getFilteredTrades().length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto max-w-md py-12">
              <h2 className="text-xl font-semibold">No trades found</h2>
              <p className="mt-2 text-muted-foreground">
                {selectedAccounts.length > 0 
                  ? "No trades found for the selected accounts and timeframe." 
                  : "Start by adding trades to see your performance analytics."}
              </p>
              <div className="mt-6">
                <a href="/trades" className="inline-flex items-center gap-1 text-primary hover:underline">
                  Go to Trades <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        
        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Tabs 
            defaultValue="30d" 
            value={timeframe} 
            onValueChange={setTimeframe} 
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total P&L
            </CardTitle>
            {metrics.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winCount} wins, {metrics.lossCount} losses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Win Rate
            </CardTitle>
            {metrics.winRate >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalTradeCount} total trades
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit Factor
            </CardTitle>
            {metrics.profitFactor >= 1 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Wins / Losses ratio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.avgDuration)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per completed trade
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equity Curve</CardTitle>
            <CardDescription>Cumulative P&L over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {cumulativePnLData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={cumulativePnLData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), "P&L"]} 
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke={metrics.totalPnL >= 0 ? PROFIT_COLOR : LOSS_COLOR}
                    strokeWidth={2} 
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display a chart</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* P&L Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P&L Distribution</CardTitle>
            <CardDescription>Trade outcomes by P&L range</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pnlDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={pnlDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, "Trades"]} 
                    labelFormatter={(label) => `P&L: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={PROFIT_COLOR}
                    radius={[4, 4, 0, 0]}
                  >
                    {pnlDistributionData.map((entry, index) => {
                      const isPositive = !entry.range.includes('-');
                      return <Cell key={`cell-${index}`} fill={isPositive ? PROFIT_COLOR : LOSS_COLOR} />;
                    })}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display a chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Advanced Analysis */}
      <div>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="patterns">Trade Patterns</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            <AdvancedMetrics 
              metrics={metrics} 
              symbolPerformanceData={symbolPerformanceData}
              dayOfWeekData={dayOfWeekData}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
          
          <TabsContent value="patterns">
            <TradePatternAnalysis 
              durationData={durationData}
              trades={getFilteredTrades()}
              formatCurrency={formatCurrency}
              formatDuration={formatDuration}
            />
          </TabsContent>
          
          <TabsContent value="risk">
            <RiskManagementAnalysis 
              trades={getFilteredTrades()}
              metrics={metrics}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 