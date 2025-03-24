"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Calendar, Clock, ArrowRight, Layers } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "@/hooks/useAccounts";
import { parseISO, format, isAfter, subDays, subMonths, subYears } from "date-fns";
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
  Cell,
} from "recharts";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const PROFIT_COLOR = '#10b981'; // Green
const LOSS_COLOR = '#ef4444';   // Red

export default function AnalyticsPage() {
  // States
  const [timeframe, setTimeframe] = useState("30d");
  const [rawTrades, setRawTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAccounts } = useAccounts();
  
  // Load trades from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        try {
          const parsed = JSON.parse(storedTrades);
          if (parsed && typeof parsed === 'object') {
            // Safely convert object to array
            const tradesArray = [];
            for (const key in parsed) {
              if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                tradesArray.push(parsed[key]);
              }
            }
            setRawTrades(tradesArray);
          }
        } catch (error) {
          console.error("Error parsing trades:", error);
          setRawTrades([]);
        }
      }
    } catch (error) {
      console.error("Error loading trades:", error);
      setRawTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get filtered trades based on timeframe and selected accounts
  const getFilteredTrades = () => {
    if (!rawTrades || !Array.isArray(rawTrades)) return [];
    
    const now = new Date();
    let startDate = new Date(0); // Default to beginning of time
    
    // Set date range based on selected timeframe
    switch (timeframe) {
      case "7d": startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "90d": startDate = subDays(now, 90); break;
      case "1y": startDate = subYears(now, 1); break;
      case "all": startDate = new Date(0); break;
    }
    
    return rawTrades.filter(trade => {
      if (!trade || !trade.entryDate) return false;
      
      try {
        const entryDate = parseISO(trade.entryDate);
        // Check if date is valid
        if (isNaN(entryDate.getTime())) return false;
        
        // Filter by date and account
        return isAfter(entryDate, startDate) && 
               (selectedAccounts.length === 0 || 
                (trade.accountId && selectedAccounts.includes(trade.accountId)));
      } catch (error) {
        return false;
      }
    });
  };
  
  // Calculate metrics
  const calculateMetrics = () => {
    const trades = getFilteredTrades();
    
    // Count metrics
    const totalTrades = trades.length;
    let winCount = 0;
    let lossCount = 0;
    let totalPnL = 0;
    let winningAmount = 0;
    let losingAmount = 0;
    let longTrades = 0;
    let shortTrades = 0;
    let longPnL = 0;
    let shortPnL = 0;
    let breakEvenTrades = 0;
    
    // Calculate metrics
    trades.forEach(trade => {
      const pnl = trade.pnl || 0;
      totalPnL += pnl;
      
      if (pnl > 0) {
        winCount++;
        winningAmount += pnl;
      } else if (pnl < 0) {
        lossCount++;
        losingAmount += Math.abs(pnl);
      } else {
        breakEvenTrades++;
      }
      
      // Direction metrics
      if (trade.direction === 'LONG' || trade.direction === 'long') {
        longTrades++;
        longPnL += pnl;
      } else if (trade.direction === 'SHORT' || trade.direction === 'short') {
        shortTrades++;
        shortPnL += pnl;
      }
    });
    
    // Calculate additional metrics
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const avgWin = winCount > 0 ? winningAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? losingAmount / lossCount : 0;
    const profitFactor = losingAmount > 0 ? winningAmount / losingAmount : winningAmount > 0 ? Infinity : 0;
    
    return {
      totalTrades,
      winCount,
      lossCount,
      breakEvenTrades,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      longTrades,
      shortTrades,
      longPnL,
      shortPnL
    };
  };
  
  // Safely get equity curve data
  const getEquityCurveData = () => {
    const trades = getFilteredTrades();
    if (trades.length === 0) return [];
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => {
      try {
        return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      } catch (error) {
        return 0;
      }
    });
    
    // Calculate cumulative P&L
    let cumulativePnL = 0;
    return sortedTrades.map(trade => {
      try {
        cumulativePnL += (trade.pnl || 0);
        return {
          date: format(parseISO(trade.entryDate), 'MM/dd'),
          pnl: cumulativePnL
        };
      } catch (error) {
        return null;
      }
    }).filter(item => item !== null);
  };
  
  // Safely get P&L by symbol data
  const getPnLBySymbol = () => {
    const trades = getFilteredTrades();
    if (trades.length === 0) return [];
    
    const symbolData = {};
    
    trades.forEach(trade => {
      if (!trade || !trade.symbol) return;
      
      const symbol = trade.symbol;
      const pnl = trade.pnl || 0;
      
      if (!symbolData[symbol]) {
        symbolData[symbol] = {
          symbol,
          pnl: 0,
          trades: 0,
          winCount: 0
        };
      }
      
      symbolData[symbol].pnl += pnl;
      symbolData[symbol].trades++;
      
      if (pnl > 0) {
        symbolData[symbol].winCount++;
      }
    });
    
    // Convert to array and add win rate
    const result = Object.values(symbolData).map(item => ({
      ...item,
      winRate: item.trades > 0 ? (item.winCount / item.trades) * 100 : 0
    }));
    
    // Sort by P&L
    return result.sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  };
  
  // Safely get win/loss distribution
  const getWinLossDistribution = () => {
    const trades = getFilteredTrades();
    if (trades.length === 0) return [];
    
    // Create range buckets for P&L values
    const ranges = {};
    
    trades.forEach(trade => {
      const pnl = trade.pnl || 0;
      
      // Create bucket ranges (nearest $50)
      let bucketName;
      if (pnl >= 1000) {
        bucketName = '>$1000';
      } else if (pnl <= -1000) {
        bucketName = '<-$1000';
      } else {
        const rounded = Math.floor(pnl / 50) * 50;
        bucketName = formatCurrency(rounded);
      }
      
      if (!ranges[bucketName]) {
        ranges[bucketName] = 0;
      }
      
      ranges[bucketName]++;
    });
    
    // Convert to array for chart
    return Object.entries(ranges)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        try {
          const aValue = parseFloat(a.range.replace(/[^0-9.-]+/g, "")) || 0;
          const bValue = parseFloat(b.range.replace(/[^0-9.-]+/g, "")) || 0;
          return aValue - bValue;
        } catch (error) {
          return 0;
        }
      });
  };
  
  // Safely get win/loss pie chart data
  const getWinLossPieData = () => {
    const { winCount, lossCount, breakEvenTrades } = calculateMetrics();
    
    return [
      { name: 'Wins', value: winCount },
      { name: 'Losses', value: lossCount },
      { name: 'Break-Even', value: breakEvenTrades }
    ].filter(item => item.value > 0);
  };
  
  // Calculate metrics once
  const metrics = calculateMetrics();
  const equityCurveData = getEquityCurveData();
  const pnlBySymbol = getPnLBySymbol();
  const winLossDistribution = getWinLossDistribution();
  const winLossPieData = getWinLossPieData();
  
  // Loading state
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
  
  // No trades state
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
  
  // Main content
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-3">
            <BarChart3 className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trading Analytics</h1>
            <p className="text-muted-foreground text-sm">
              {timeframe === "all" ? "All time" : `Last ${
                timeframe === "7d" ? "7 days" : 
                timeframe === "30d" ? "30 days" : 
                timeframe === "90d" ? "90 days" : 
                "year"
              }`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Tabs 
            defaultValue="30d" 
            value={timeframe} 
            onValueChange={setTimeframe} 
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-5 w-full">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 overflow-hidden border-none shadow-sm">
          <CardContent className="p-0">
            <div className={`h-2 w-full ${metrics.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">Total P&L</h3>
                {metrics.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`mt-2 text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.totalPnL)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                From {metrics.totalTrades} total trades
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 overflow-hidden border-none shadow-sm">
          <CardContent className="p-0">
            <div className={`h-2 w-full ${metrics.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">Win Rate</h3>
                {metrics.winRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`mt-2 text-2xl font-bold ${metrics.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.winRate.toFixed(1)}%
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {metrics.winCount} wins, {metrics.lossCount} losses
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 overflow-hidden border-none shadow-sm">
          <CardContent className="p-0">
            <div className={`h-2 w-full ${metrics.profitFactor >= 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">Profit Factor</h3>
                {metrics.profitFactor >= 1 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`mt-2 text-2xl font-bold ${metrics.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Winning $ / Losing $
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 overflow-hidden border-none shadow-sm">
          <CardContent className="p-0">
            <div className="h-2 w-full bg-indigo-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">Avg. Trade</h3>
                <Layers className="h-4 w-4 text-indigo-500" />
              </div>
              <div className={`mt-2 text-2xl font-bold ${metrics.totalPnL / metrics.totalTrades >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.totalPnL / metrics.totalTrades)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Per trade average
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
            <CardDescription>Cumulative P&L over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {equityCurveData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={equityCurveData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), "P&L"]} />
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
                <p className="text-muted-foreground">Not enough data to display chart</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* P&L Distribution */}
        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm">
          <CardHeader>
            <CardTitle>P&L Distribution</CardTitle>
            <CardDescription>Frequency of P&L outcomes</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {winLossDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={winLossDistribution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="range" 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    fontSize={12}
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    fontSize={12}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    formatter={(value) => [value, "Trades"]} 
                    labelFormatter={(label) => `P&L: ${label}`}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "0.5rem",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Trades"
                    radius={[4, 4, 0, 0]}
                  >
                    {winLossDistribution.map((entry, index) => {
                      const isPositive = !entry.range.includes('-');
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isPositive ? "url(#profitGradient)" : "url(#lossGradient)"}
                        />
                      );
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
      
      {/* Direction & Top Symbols Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direction Stats */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                strokeWidth="2" 
                stroke="currentColor" 
                className="h-5 w-5 text-indigo-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <CardTitle className="text-base font-medium">Trading Direction Analysis</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Performance comparison between long and short positions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {metrics.longCount > 0 || metrics.shortCount > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Long Stats */}
                  <div className={`rounded-lg border ${metrics.longPnL >= 0 ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'} p-4`}>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      Long Positions
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Count</div>
                        <div className="text-lg font-semibold">{metrics.longCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">% of Trades</div>
                        <div className="text-lg font-semibold">
                          {((metrics.longCount / metrics.totalTradeCount) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Win Rate</div>
                        <div className="text-lg font-semibold">
                          {metrics.longCount > 0 
                            ? ((metrics.longCount > 0 && metrics.longPnL > 0 ? metrics.winCount / metrics.longCount : 0) * 100).toFixed(1) 
                            : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">P&L</div>
                        <div className={`text-lg font-semibold ${metrics.longPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {formatCurrency(metrics.longPnL)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Short Stats */}
                  <div className={`rounded-lg border ${metrics.shortPnL >= 0 ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'} p-4`}>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" />
                      Short Positions
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Count</div>
                        <div className="text-lg font-semibold">{metrics.shortCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">% of Trades</div>
                        <div className="text-lg font-semibold">
                          {((metrics.shortCount / metrics.totalTradeCount) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Win Rate</div>
                        <div className="text-lg font-semibold">
                          {metrics.shortCount > 0 
                            ? ((metrics.shortCount > 0 && metrics.shortPnL > 0 ? metrics.winCount / metrics.shortCount : 0) * 100).toFixed(1) 
                            : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">P&L</div>
                        <div className={`text-lg font-semibold ${metrics.shortPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {formatCurrency(metrics.shortPnL)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Direction Comparison Chart */}
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: "Long", pnl: metrics.longPnL, count: metrics.longCount },
                        { name: "Short", pnl: metrics.shortPnL, count: metrics.shortCount }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      barGap={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "pnl") return [formatCurrency(value as number), "P&L"];
                          return [value, "Trades"];
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderRadius: "0.5rem",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="pnl" 
                        name="P&L" 
                        fill="#8B5CF6" 
                        yAxisId="left"
                        radius={[4, 4, 0, 0]}
                      >
                        {[
                          { name: "Long", pnl: metrics.longPnL },
                          { name: "Short", pnl: metrics.shortPnL }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="count" 
                        name="Trade Count" 
                        fill="#6366F1" 
                        yAxisId="right"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display direction analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Symbols Performance */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                strokeWidth="2" 
                stroke="currentColor" 
                className="h-5 w-5 text-indigo-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
              <CardTitle className="text-base font-medium">Top Symbols Performance</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Performance metrics for your most traded symbols
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {symbolPerformanceData.length > 0 ? (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs bg-slate-50 dark:bg-slate-800/50 uppercase">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Symbol</th>
                      <th className="px-4 py-2 text-center">Trades</th>
                      <th className="px-4 py-2 text-center">Win Rate</th>
                      <th className="px-4 py-2 text-right rounded-r-lg">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolPerformanceData.slice(0, 5).map((symbol, index) => (
                      <tr key={symbol.symbol} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-medium">{symbol.symbol}</td>
                        <td className="px-4 py-3 text-center">{symbol.count}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mr-2">
                              <div 
                                className={`h-2 rounded-full ${symbol.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`} 
                                style={{ width: `${symbol.winRate}%` }}
                              ></div>
                            </div>
                            <span>{symbol.winRate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${symbol.pnl >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {formatCurrency(symbol.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {symbolPerformanceData.length > 5 && (
                  <div className="mt-3 text-center">
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                      View all {symbolPerformanceData.length} symbols
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No symbol performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Heatmap - Redesigned */}
      <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="2" 
              stroke="currentColor" 
              className="h-5 w-5 text-indigo-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
            <CardTitle className="text-base font-medium">Weekly Trading Heat Map</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Performance by day of week and time of day
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            try {
              // Generate heatmap data
              const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              const timeSlots = Array.from({ length: 24 }, (_, i) => i);
              
              // Create a grid for the heatmap
              const heatmapGrid: Record<string, Record<number, { count: number; pnl: number }>> = {};
              
              // Initialize the grid with zeros
              daysOfWeek.forEach(day => {
                heatmapGrid[day] = {};
                timeSlots.forEach(hour => {
                  heatmapGrid[day][hour] = { count: 0, pnl: 0 };
                });
              });
              
              // Fill the grid with trade data
              const filteredTrades = getFilteredTrades();
              
              filteredTrades.forEach(trade => {
                if (!trade || !trade.entryDate) return;
                
                try {
                  const tradeDate = parseISO(trade.entryDate);
                  const dayOfWeek = format(tradeDate, 'EEEE');
                  const hour = tradeDate.getHours();
                  
                  if (daysOfWeek.includes(dayOfWeek) && hour >= 0 && hour < 24) {
                    heatmapGrid[dayOfWeek][hour].count += 1;
                    heatmapGrid[dayOfWeek][hour].pnl += (trade.pnl || 0);
                  }
                } catch (error) {
                  console.error("Error processing trade for heatmap", error);
                }
              });
              
              // Get color intensity for a cell
              const getCellColor = (pnl: number, count: number) => {
                if (count === 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500';
                
                if (pnl > 0) {
                  // Green gradients for profits, intensity based on number of trades
                  if (count >= 5) return 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300';
                  if (count >= 3) return 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400';
                  return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-500';
                } else if (pnl < 0) {
                  // Red gradients for losses, intensity based on number of trades
                  if (count >= 5) return 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300';
                  if (count >= 3) return 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400';
                  return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-500';
                }
                
                // Neutral (break-even)
                return 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300';
              };
              
              // Only include market hours (9AM to 5PM for simplicity)
              const marketHours = timeSlots.filter(hour => hour >= 9 && hour <= 16);
              
              // Trading days (Mon-Fri)
              const tradingDays = daysOfWeek.filter(day => 
                day !== 'Saturday' && day !== 'Sunday'
              );
              
              return (
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Time labels (top) */}
                    <div className="flex">
                      <div className="w-28 shrink-0"></div>
                      {marketHours.map(hour => (
                        <div key={`hour-${hour}`} className="w-14 text-center text-xs text-slate-500 dark:text-slate-400 pb-2">
                          {hour}:00
                        </div>
                      ))}
                    </div>
                    
                    {/* Days and cells */}
                    {tradingDays.map(day => (
                      <div key={`day-${day}`} className="flex items-center mt-2">
                        <div className="w-28 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">{day}</div>
                        {marketHours.map(hour => {
                          const cell = heatmapGrid[day][hour];
                          const colorClass = getCellColor(cell.pnl, cell.count);
                          
                          return (
                            <div 
                              key={`cell-${day}-${hour}`}
                              className={`w-14 h-14 flex flex-col items-center justify-center rounded-md text-xs border ${colorClass} transition-all hover:opacity-90 m-0.5`}
                              title={`${day} ${hour}:00 - ${(hour+1) % 24}:00 | Trades: ${cell.count} | P&L: ${formatCurrency(cell.pnl)}`}
                            >
                              <div className="font-medium">{cell.count > 0 ? cell.count : ''}</div>
                              {cell.count > 0 && (
                                <div className="text-[10px]">
                                  {formatCurrency(cell.pnl)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    {/* Legend */}
                    <div className="flex items-center justify-end mt-6 gap-3 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 mr-1"></div>
                        <span className="text-slate-600 dark:text-slate-300">Profitable</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 mr-1"></div>
                        <span className="text-slate-600 dark:text-slate-300">Unprofitable</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 mr-1"></div>
                        <span className="text-slate-600 dark:text-slate-300">Break-even</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mr-1"></div>
                        <span className="text-slate-600 dark:text-slate-300">No trades</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error("Error rendering heatmap:", error);
              return (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">Unable to display heatmap</p>
                </div>
              );
            }
          })()}
        </CardContent>
      </Card>
      
      {/* Advanced Analysis Tabs - Redesigned */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border-none overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="2" 
              stroke="currentColor" 
              className="h-5 w-5 text-indigo-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <h3 className="text-base font-medium">Advanced Trading Analysis</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dive deeper into your trading patterns and performance metrics
          </p>
        </div>
        
        <div className="p-6">
          <Tabs defaultValue="metrics" className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-800">
              <TabsList className="flex h-auto p-0 bg-transparent space-x-6">
                <TabsTrigger 
                  value="metrics" 
                  className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none bg-transparent px-4"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Detailed Metrics
                </TabsTrigger>
                <TabsTrigger 
                  value="patterns" 
                  className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none bg-transparent px-4"
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Trade Patterns
                </TabsTrigger>
                <TabsTrigger 
                  value="risk" 
                  className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none bg-transparent px-4"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Risk Management
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none bg-transparent px-4"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mt-6">
              <TabsContent value="metrics" className="m-0">
                <AdvancedMetrics 
                  metrics={metrics} 
                  symbolPerformanceData={symbolPerformanceData}
                  dayOfWeekData={dayOfWeekData}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
              
              <TabsContent value="patterns" className="m-0">
                <TradePatternAnalysis 
                  durationData={durationData}
                  trades={getFilteredTrades()}
                  formatCurrency={formatCurrency}
                  formatDuration={formatDuration}
                />
              </TabsContent>
              
              <TabsContent value="risk" className="m-0">
                <RiskManagementAnalysis 
                  trades={getFilteredTrades()}
                  metrics={metrics}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
              
              <TabsContent value="insights" className="m-0">
                <div className="border-none shadow-md rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="h-6 w-6"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <circle cx="12" cy="12" r="4"></circle>
                      </svg>
                      <h3 className="text-xl font-medium">AI Trading Insights</h3>
                    </div>
                    <p className="text-white/80 mt-1">
                      Personalized recommendations based on your trading patterns
                    </p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strength Analysis */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="h-5 w-5 text-green-500"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Your Trading Strengths
                        </h3>
                        
                        <div className="space-y-3">
                          {metrics.profitFactor >= 1.5 && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <div className="font-medium text-green-700 dark:text-green-400">Solid Profit Factor</div>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Your profit factor of {metrics.profitFactor.toFixed(2)} indicates a strong trading edge. Keep leveraging this strength.
                              </p>
                            </div>
                          )}
                          
                          {metrics.winRate >= 55 && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <div className="font-medium text-green-700 dark:text-green-400">High Win Rate</div>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Your win rate of {metrics.winRate.toFixed(1)}% is above average. Consider increasing position sizes when your edge is strongest.
                              </p>
                            </div>
                          )}
                          
                          {dayOfWeekData.some(day => day.pnl > 0 && day.winRate > 60) && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <div className="font-medium text-green-700 dark:text-green-400">Strong Day Performance</div>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                You perform exceptionally well on {dayOfWeekData.filter(day => day.pnl > 0 && day.winRate > 60)[0].day}s. Consider focusing more trades on your best-performing days.
                              </p>
                            </div>
                          )}
                          
                          {symbolPerformanceData.some(symbol => symbol.winRate > 65) && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <div className="font-medium text-green-700 dark:text-green-400">Symbol Specialization</div>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Your analysis of {symbolPerformanceData.filter(symbol => symbol.winRate > 65)[0].symbol} is particularly strong with a {symbolPerformanceData.filter(symbol => symbol.winRate > 65)[0].winRate.toFixed(1)}% win rate. Consider specializing more in this instrument.
                              </p>
                            </div>
                          )}
                          
                          {!metrics.profitFactor >= 1.5 && !metrics.winRate >= 55 && !dayOfWeekData.some(day => day.pnl > 0 && day.winRate > 60) && !symbolPerformanceData.some(symbol => symbol.winRate > 65) && (
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div className="font-medium text-slate-700 dark:text-slate-300">Building Your Strengths</div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Continue trading and collecting data to identify your strongest edges in the market.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Improvement Areas */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="h-5 w-5 text-amber-500"
                          >
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                          </svg>
                          Areas for Improvement
                        </h3>
                        
                        <div className="space-y-3">
                          {metrics.profitFactor < 1.5 && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <div className="font-medium text-amber-700 dark:text-amber-400">Enhance Profit Factor</div>
                              <p className="text-sm text-amber-600 dark:text-amber-300">
                                Your profit factor of {metrics.profitFactor.toFixed(2)} could be improved. Focus on reducing the size of losing trades or increasing winners.
                              </p>
                            </div>
                          )}
                          
                          {metrics.avgWin < Math.abs(metrics.avgLoss) && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <div className="font-medium text-amber-700 dark:text-amber-400">Improve Risk-Reward</div>
                              <p className="text-sm text-amber-600 dark:text-amber-300">
                                Your average win ({formatCurrency(metrics.avgWin)}) is smaller than your average loss ({formatCurrency(Math.abs(metrics.avgLoss))}). Try to let winners run longer or cut losses sooner.
                              </p>
                            </div>
                          )}
                          
                          {durationData.some(dur => dur.avgPnl < 0) && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <div className="font-medium text-amber-700 dark:text-amber-400">Duration Issues</div>
                              <p className="text-sm text-amber-600 dark:text-amber-300">
                                Trades lasting {durationData.filter(dur => dur.avgPnl < 0)[0].duration} tend to be unprofitable. Consider adjusting your strategy for trades in this timeframe.
                              </p>
                            </div>
                          )}
                          
                          {dayOfWeekData.some(day => day.pnl < 0 && day.count > 2) && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <div className="font-medium text-amber-700 dark:text-amber-400">Challenging Trading Days</div>
                              <p className="text-sm text-amber-600 dark:text-amber-300">
                                You consistently struggle on {dayOfWeekData.filter(day => day.pnl < 0 && day.count > 2)[0].day}s. Consider reducing your trading size or skipping these days.
                              </p>
                            </div>
                          )}
                          
                          {!metrics.profitFactor < 1.5 && !metrics.avgWin < Math.abs(metrics.avgLoss) && !durationData.some(dur => dur.avgPnl < 0) && !dayOfWeekData.some(day => day.pnl < 0 && day.count > 2) && (
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div className="font-medium text-slate-700 dark:text-slate-300">Looking Good</div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Your trading metrics look solid! Continue monitoring for areas to refine as you gather more data.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Strategy Recommendations */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-5 w-5 text-blue-500"
                        >
                          <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          <path d="M14 12v.01"></path>
                        </svg>
                        Strategy Recommendations
                      </h3>
                      
                      <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/30 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              Position Sizing
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {metrics.profitFactor >= 1.5 
                                ? "Consider scaling up position sizes by 15-20% on your highest probability setups."
                                : "Reduce position sizes by 15-20% until your profit factor improves above 1.5."}
                            </p>
                          </div>
                          
                          <div className="space-y-2 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              Market Focus
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {symbolPerformanceData.length > 0 
                                ? `Focus on ${symbolPerformanceData[0].symbol} which shows your strongest performance with ${formatCurrency(symbolPerformanceData[0].pnl)} P&L.`
                                : "Not enough data to recommend specific markets yet. Continue trading to build your performance history."}
                            </p>
                          </div>
                          
                          <div className="space-y-2 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              Timing Adjustments
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {durationData.some(d => d.avgPnl > 0)
                                ? `Your best performance is in ${durationData.sort((a, b) => b.avgPnl - a.avgPnl)[0].duration} trades. Try to optimize your strategy for this timeframe.`
                                : "Hold your profitable trades longer. Your average winner duration is too short to maximize returns."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trading Journal Integration */}
                    <div className="mt-8 p-5 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-slate-200">Track your progress against recommendations</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Record your thoughts and actions in your trading journal to measure improvement
                        </p>
                      </div>
                      <a href="/journal" className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity">
                        Go to Journal
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 