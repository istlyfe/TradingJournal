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
      return dateInRange && accountSelected && trade.exitDate; // Only include closed trades
    });
  };

  const filteredTrades = getFilteredTrades();
  
  // Calculate performance metrics
  const calculateMetrics = () => {
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0);
    
    const winRate = totalTrades > 0 
      ? (winningTrades.length / totalTrades) * 100 
      : 0;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losingTrades.length
      : 0;

    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Average trade duration
    const tradesWithDuration = filteredTrades.filter(trade => trade.exitDate && trade.entryDate);
    const avgDuration = tradesWithDuration.length > 0 
      ? tradesWithDuration.reduce((sum, trade) => {
          const duration = differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
          return sum + duration;
        }, 0) / tradesWithDuration.length
      : 0;
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      avgDuration,
      totalPnL,
      grossProfit,
      grossLoss
    };
  };
  
  const metrics = calculateMetrics();
  
  // Format duration helper
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  // Calculate cumulative P&L data for chart
  const getCumulativePnLData = () => {
    if (filteredTrades.length === 0) return [];
    
    // Sort trades by date
    const sortedTrades = [...filteredTrades].sort((a, b) => {
      const dateA = parseISO(a.exitDate || a.entryDate);
      const dateB = parseISO(b.exitDate || b.entryDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    let cumulativePnL = 0;
    return sortedTrades.map(trade => {
      cumulativePnL += (trade.pnl || 0);
      return {
        date: format(parseISO(trade.exitDate || trade.entryDate), 'MMM dd'),
        pnl: cumulativePnL
      };
    });
  };

  // Calculate P&L distribution data for chart
  const getPnLDistributionData = () => {
    const ranges = [
      { name: '<-$500', min: -Infinity, max: -500 },
      { name: '-$500 to -$100', min: -500, max: -100 },
      { name: '-$100 to -$1', min: -100, max: -1 },
      { name: '$0 to $100', min: 0, max: 100 },
      { name: '$100 to $500', min: 100, max: 500 },
      { name: '>$500', min: 500, max: Infinity }
    ];
    
    const distribution = ranges.map(range => ({
      name: range.name,
      value: filteredTrades.filter(t => {
        const pnl = t.pnl || 0;
        return pnl > range.min && pnl <= range.max;
      }).length
    }));
    
    return distribution.filter(item => item.value > 0);
  };

  // Calculate performance by symbol
  const getSymbolPerformance = () => {
    const symbolMap: Record<string, { trades: number, pnl: number, winRate: number }> = {};
    
    filteredTrades.forEach(trade => {
      if (!symbolMap[trade.symbol]) {
        symbolMap[trade.symbol] = { trades: 0, pnl: 0, winRate: 0 };
      }
      symbolMap[trade.symbol].trades += 1;
      symbolMap[trade.symbol].pnl += (trade.pnl || 0);
    });
    
    // Calculate win rate for each symbol
    Object.keys(symbolMap).forEach(symbol => {
      const symbolTrades = filteredTrades.filter(t => t.symbol === symbol);
      const wins = symbolTrades.filter(t => (t.pnl || 0) > 0).length;
      symbolMap[symbol].winRate = symbolTrades.length > 0 
        ? (wins / symbolTrades.length) * 100
        : 0;
    });
    
    // Convert to array and sort by P&L
    return Object.entries(symbolMap)
      .map(([symbol, data]) => ({ 
        symbol,
        trades: data.trades,
        pnl: data.pnl,
        winRate: data.winRate
      }))
      .sort((a, b) => b.pnl - a.pnl);
  };

  // Calculate performance by day of week
  const getDayOfWeekPerformance = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: Record<string, { trades: number, pnl: number }> = {};
    
    // Initialize all days
    days.forEach(day => {
      dayMap[day] = { trades: 0, pnl: 0 };
    });
    
    filteredTrades.forEach(trade => {
      const date = parseISO(trade.exitDate || trade.entryDate);
      const day = days[date.getDay()];
      dayMap[day].trades += 1;
      dayMap[day].pnl += (trade.pnl || 0);
    });
    
    // Convert to array for chart
    return days.map(day => ({
      name: day.substring(0, 3), // Abbreviate
      pnl: dayMap[day].pnl,
      trades: dayMap[day].trades
    }));
  };

  // Calculate trade duration distribution
  const getTradeDurationData = () => {
    const durationRanges = [
      { name: '<15m', min: 0, max: 15 },
      { name: '15m-1h', min: 15, max: 60 },
      { name: '1h-4h', min: 60, max: 240 },
      { name: '4h-1d', min: 240, max: 1440 },
      { name: '>1d', min: 1440, max: Infinity }
    ];
    
    const tradesWithDuration = filteredTrades.filter(trade => trade.exitDate && trade.entryDate);
    
    const distribution = durationRanges.map(range => ({
      name: range.name,
      count: tradesWithDuration.filter(trade => {
        const duration = differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
        return duration >= range.min && duration < range.max;
      }).length,
      avgPnL: tradesWithDuration.filter(trade => {
        const duration = differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
        return duration >= range.min && duration < range.max;
      }).reduce((sum, trade) => sum + (trade.pnl || 0), 0) / 
      tradesWithDuration.filter(trade => {
        const duration = differenceInMinutes(parseISO(trade.exitDate!), parseISO(trade.entryDate));
        return duration >= range.min && duration < range.max;
      }).length || 0
    }));
    
    return distribution.filter(item => item.count > 0);
  };
  
  const cumulativePnLData = getCumulativePnLData();
  const pnlDistributionData = getPnLDistributionData();
  const symbolPerformance = getSymbolPerformance();
  const dayOfWeekData = getDayOfWeekPerformance();
  const tradeDurationData = getTradeDurationData();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading analytics...</div>;
  }
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Analyze your trading performance and identify patterns</p>
        </div>
        <div>
          <select 
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <PieChart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.winningTrades} wins / {metrics.losingTrades} losses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <LineChart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.grossProfit)} / {formatCurrency(metrics.grossLoss)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Win</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(metrics.avgWin)}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.winningTrades} winning trades
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{formatCurrency(metrics.avgLoss)}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.losingTrades} losing trades
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Average Duration and Total P&L */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Trade Duration</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {metrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Over the {timeframe === 'all' ? 'entire period' : `last ${timeframe}`}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="symbols">Symbols</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative P&L</CardTitle>
                <CardDescription>
                  Your profit and loss over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {cumulativePnLData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={cumulativePnLData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'P&L']} />
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke={metrics.totalPnL >= 0 ? PROFIT_COLOR : LOSS_COLOR} 
                        strokeWidth={2}
                        dot={{ r: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>P&L Distribution</CardTitle>
                <CardDescription>
                  Distribution of trade profits and losses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {pnlDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pnlDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pnlDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trade Durations</CardTitle>
                <CardDescription>
                  How long your trades last, and how they perform
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {tradeDurationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={tradeDurationData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'count') return [value, 'Number of Trades'];
                        return [`$${value}`, 'Average P&L'];
                      }} />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Number of Trades" 
                        fill="#8884d8" 
                        yAxisId="left"
                      />
                      <Bar 
                        dataKey="avgPnL" 
                        name="Average P&L" 
                        fill="#82ca9d" 
                        yAxisId="right"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="symbols" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Symbol</CardTitle>
              <CardDescription>
                Your best and worst performing symbols
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {symbolPerformance.length > 0 ? (
                <div className="grid gap-4">
                  {/* Symbol performance chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={symbolPerformance.slice(0, 10)} // Top 10 symbols
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                        <YAxis dataKey="symbol" type="category" width={70} />
                        <Tooltip formatter={(value) => [`$${value}`, 'P&L']} />
                        <Legend />
                        <Bar 
                          dataKey="pnl" 
                          name="P&L" 
                          fill={(entry) => entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR}
                        >
                          {symbolPerformance.slice(0, 10).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} 
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Symbols table */}
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                      <div>Symbol</div>
                      <div className="text-right">Trades</div>
                      <div className="text-right">Win Rate</div>
                      <div className="text-right">P&L</div>
                    </div>
                    <div className="divide-y">
                      {symbolPerformance.map((symbol, index) => (
                        <div key={index} className="grid grid-cols-4 p-3 hover:bg-muted/50 text-sm">
                          <div className="font-medium">{symbol.symbol}</div>
                          <div className="text-right">{symbol.trades}</div>
                          <div className="text-right">{symbol.winRate.toFixed(1)}%</div>
                          <div className={`text-right font-medium ${symbol.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(symbol.pnl)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-muted-foreground">No symbol data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Day of Week</CardTitle>
                <CardDescription>
                  Your best and worst trading days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {dayOfWeekData.some(day => day.trades > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={dayOfWeekData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'trades') return [value, 'Number of Trades'];
                        return [`$${value}`, 'P&L'];
                      }} />
                      <Legend />
                      <Bar 
                        dataKey="trades" 
                        name="Number of Trades" 
                        fill="#8884d8" 
                        yAxisId="left"
                      />
                      <Bar 
                        dataKey="pnl" 
                        name="P&L" 
                        fill="#82ca9d" 
                        yAxisId="right"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
