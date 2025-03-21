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
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      setTrades(JSON.parse(storedTrades));
    }
    setIsLoading(false);
  }, []);
  
  // Filter trades by timeframe and selected accounts
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subYears(now, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return Object.values(trades).filter(trade => {
      const tradeDate = parseISO(trade.entryDate);
      const isAfterStartDate = isAfter(tradeDate, startDate);
      const isBeforeNow = isBefore(tradeDate, now);
      const isSelectedAccount = selectedAccounts.length === 0 || selectedAccounts.includes(trade.accountId || 'default');
      
      return isAfterStartDate && isBeforeNow && isSelectedAccount;
    });
  };
  
  // Calculate key metrics
  const calculateMetrics = () => {
    const filteredTrades = getFilteredTrades();
    
    // Total P&L
    const totalPnl = filteredTrades.reduce((total, trade) => total + (trade.pnl || 0), 0);
    
    // Win rate
    const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0);
    const winRate = filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0;
    
    // Average trade P&L
    const avgTradePnl = filteredTrades.length > 0 ? totalPnl / filteredTrades.length : 0;
    
    // Largest win and loss
    const largestWin = filteredTrades.length > 0 ? 
      Math.max(...filteredTrades.map(trade => trade.pnl || 0)) : 0;
    const largestLoss = filteredTrades.length > 0 ? 
      Math.min(...filteredTrades.map(trade => trade.pnl || 0)) : 0;
    
    // Average trade duration
    const avgTradeDuration = filteredTrades.reduce((total, trade) => {
      if (trade.entryDate && trade.exitDate) {
        const entryDate = parseISO(trade.entryDate);
        const exitDate = parseISO(trade.exitDate);
        return total + differenceInMinutes(exitDate, entryDate);
      }
      return total;
    }, 0) / (filteredTrades.length || 1);
    
    // Long vs Short performance
    const longTrades = filteredTrades.filter(trade => trade.direction === 'LONG');
    const shortTrades = filteredTrades.filter(trade => trade.direction === 'SHORT');
    
    const longPnl = longTrades.reduce((total, trade) => total + (trade.pnl || 0), 0);
    const shortPnl = shortTrades.reduce((total, trade) => total + (trade.pnl || 0), 0);
    
    const longWinRate = longTrades.length > 0 ? 
      (longTrades.filter(trade => (trade.pnl || 0) > 0).length / longTrades.length) * 100 : 0;
    const shortWinRate = shortTrades.length > 0 ? 
      (shortTrades.filter(trade => (trade.pnl || 0) > 0).length / shortTrades.length) * 100 : 0;
    
    return {
      totalPnl,
      winRate,
      avgTradePnl,
      largestWin,
      largestLoss,
      avgTradeDuration,
      longPnl,
      shortPnl,
      longWinRate,
      shortWinRate,
      tradeCount: filteredTrades.length,
      winningTradeCount: winningTrades.length,
      losingTradeCount: filteredTrades.length - winningTrades.length
    };
  };
  
  // Format minutes into readable duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    
    if (minutes < 60 * 24) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
    
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    return `${days}d ${hours}h`;
  };
  
  // Get data for cumulative P&L chart
  const getCumulativePnLData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Sort trades by date
    const sortedTrades = [...filteredTrades].sort(
      (a, b) => parseISO(a.entryDate).getTime() - parseISO(b.entryDate).getTime()
    );
    
    // Calculate cumulative P&L
    let cumulativePnL = 0;
    return sortedTrades.map(trade => {
      cumulativePnL += (trade.pnl || 0);
      return {
        date: format(parseISO(trade.entryDate), 'MMM dd'),
        pnl: cumulativePnL
      };
    });
  };
  
  // Get data for P&L distribution chart
  const getPnLDistributionData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Group P&L values into ranges
    const pnlRanges: Record<string, number> = {};
    
    filteredTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      let rangeKey;
      
      if (pnl < -1000) rangeKey = '< -$1000';
      else if (pnl < -500) rangeKey = '-$1000 to -$500';
      else if (pnl < -100) rangeKey = '-$500 to -$100';
      else if (pnl < 0) rangeKey = '-$100 to $0';
      else if (pnl === 0) rangeKey = '$0';
      else if (pnl <= 100) rangeKey = '$0 to $100';
      else if (pnl <= 500) rangeKey = '$100 to $500';
      else if (pnl <= 1000) rangeKey = '$500 to $1000';
      else rangeKey = '> $1000';
      
      pnlRanges[rangeKey] = (pnlRanges[rangeKey] || 0) + 1;
    });
    
    return Object.entries(pnlRanges).map(([range, count]) => ({ range, count }));
  };
  
  // Get data for symbol performance chart
  const getSymbolPerformance = () => {
    const filteredTrades = getFilteredTrades();
    
    // Group trades by symbol
    const symbolGroups: Record<string, { totalPnl: number, count: number }> = {};
    
    filteredTrades.forEach(trade => {
      const symbol = trade.symbol;
      if (!symbolGroups[symbol]) {
        symbolGroups[symbol] = { totalPnl: 0, count: 0 };
      }
      
      symbolGroups[symbol].totalPnl += (trade.pnl || 0);
      symbolGroups[symbol].count += 1;
    });
    
    // Convert to array and sort by total P&L
    return Object.entries(symbolGroups)
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.totalPnl,
        count: data.count,
        avgPnl: data.totalPnl / data.count
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10); // Top 10 symbols by P&L
  };
  
  // Get data for day of week performance
  const getDayOfWeekPerformance = () => {
    const filteredTrades = getFilteredTrades();
    
    // Initialize days of week
    const daysOfWeek = [
      { day: 'Monday', dayNum: 1, pnl: 0, count: 0 },
      { day: 'Tuesday', dayNum: 2, pnl: 0, count: 0 },
      { day: 'Wednesday', dayNum: 3, pnl: 0, count: 0 },
      { day: 'Thursday', dayNum: 4, pnl: 0, count: 0 },
      { day: 'Friday', dayNum: 5, pnl: 0, count: 0 },
      { day: 'Saturday', dayNum: 6, pnl: 0, count: 0 },
      { day: 'Sunday', dayNum: 0, pnl: 0, count: 0 }
    ];
    
    // Group trades by day of week
    filteredTrades.forEach(trade => {
      const tradeDate = parseISO(trade.entryDate);
      const dayOfWeek = tradeDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      daysOfWeek[dayOfWeek === 0 ? 6 : dayOfWeek - 1].pnl += (trade.pnl || 0);
      daysOfWeek[dayOfWeek === 0 ? 6 : dayOfWeek - 1].count += 1;
    });
    
    // Calculate average P&L per day
    return daysOfWeek.map(day => ({
      ...day,
      avgPnl: day.count > 0 ? day.pnl / day.count : 0
    }));
  };
  
  // Get data for trade duration analysis
  const getTradeDurationData = () => {
    const filteredTrades = getFilteredTrades();
    
    // Group trades by duration
    const durationGroups: Record<string, { totalPnl: number, count: number }> = {
      '< 5m': { totalPnl: 0, count: 0 },
      '5-15m': { totalPnl: 0, count: 0 },
      '15-30m': { totalPnl: 0, count: 0 },
      '30-60m': { totalPnl: 0, count: 0 },
      '1-3h': { totalPnl: 0, count: 0 },
      '3-8h': { totalPnl: 0, count: 0 },
      '> 8h': { totalPnl: 0, count: 0 }
    };
    
    filteredTrades.forEach(trade => {
      if (trade.entryDate && trade.exitDate) {
        const entryDate = parseISO(trade.entryDate);
        const exitDate = parseISO(trade.exitDate);
        const durationMinutes = differenceInMinutes(exitDate, entryDate);
        
        let durationKey;
        if (durationMinutes < 5) durationKey = '< 5m';
        else if (durationMinutes < 15) durationKey = '5-15m';
        else if (durationMinutes < 30) durationKey = '15-30m';
        else if (durationMinutes < 60) durationKey = '30-60m';
        else if (durationMinutes < 180) durationKey = '1-3h';
        else if (durationMinutes < 480) durationKey = '3-8h';
        else durationKey = '> 8h';
        
        durationGroups[durationKey].totalPnl += (trade.pnl || 0);
        durationGroups[durationKey].count += 1;
      }
    });
    
    // Convert to array and calculate average P&L
    return Object.entries(durationGroups)
      .map(([duration, data]) => ({
        duration,
        totalPnl: data.totalPnl,
        count: data.count,
        avgPnl: data.count > 0 ? data.totalPnl / data.count : 0
      }));
  };
  
  const metrics = calculateMetrics();
  const cumulativePnLData = getCumulativePnLData();
  const pnlDistributionData = getPnLDistributionData();
  const symbolPerformanceData = getSymbolPerformance();
  const dayOfWeekData = getDayOfWeekPerformance();
  const tradeDurationData = getTradeDurationData();
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your trading performance to identify patterns and improve results.
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <Tabs value={timeframe} onValueChange={setTimeframe}>
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total P&L
            </CardTitle>
            {metrics.totalPnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.totalPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.tradeCount} trades
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Win Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.winningTradeCount} wins, {metrics.losingTradeCount} losses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Trade P&L
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.avgTradePnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.avgTradePnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per trade average
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Advanced Metrics Component */}
      <AdvancedMetrics trades={trades} timeframe={timeframe} />

      {/* Risk Management Analysis Component */}
      <RiskManagementAnalysis trades={trades} timeframe={timeframe} />
      
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>
            Your trading account growth over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {cumulativePnLData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={cumulativePnLData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    name="Cumulative P&L" 
                    stroke={PROFIT_COLOR}
                    activeDot={{ r: 8 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No trade data available for the selected timeframe.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Trade Pattern Analysis Component */}
      <TradePatternAnalysis trades={trades} timeframe={timeframe} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>P&L Distribution</CardTitle>
            <CardDescription>
              Distribution of trade P&L by range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {pnlDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={pnlDistributionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Number of Trades"
                      fill="#8884d8"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No trade data available for the selected timeframe.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Symbols</CardTitle>
            <CardDescription>
              Performance by trading symbol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {symbolPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={symbolPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="symbol" type="category" />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "P&L"]} />
                    <Legend />
                    <Bar
                      dataKey="pnl"
                      name="Total P&L"
                      fill={PROFIT_COLOR}
                    >
                      {symbolPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No trade data available for the selected timeframe.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Day of Week Performance</CardTitle>
            <CardDescription>
              P&L by day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dayOfWeekData.some(day => day.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={dayOfWeekData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "P&L"]} />
                    <Legend />
                    <Bar
                      dataKey="pnl"
                      name="Total P&L"
                      fill={PROFIT_COLOR}
                    >
                      {dayOfWeekData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No trade data available for the selected timeframe.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Trade Duration Analysis</CardTitle>
            <CardDescription>
              Performance by trade duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {tradeDurationData.some(duration => duration.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={tradeDurationData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="duration" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => {
                      if (name === "totalPnl" || name === "avgPnl") {
                        return [formatCurrency(Number(value)), name === "totalPnl" ? "Total P&L" : "Avg P&L"];
                      }
                      return [value, "Count"];
                    }} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="avgPnl"
                      name="Average P&L"
                      fill={PROFIT_COLOR}
                    >
                      {tradeDurationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                      ))}
                    </Bar>
                    <Bar
                      yAxisId="right"
                      dataKey="count"
                      name="Trade Count"
                      fill="#8884d8"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No trade data available for the selected timeframe.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
