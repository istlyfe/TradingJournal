"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/types/trade";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  DollarSign, 
  BarChart2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  BarChart3,
  Radar as RadarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "@/hooks/use-account";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"];

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("month");
  const [viewMode, setViewMode] = useState<"overview" | "performance" | "risk" | "patterns">("overview");
  const { selectedAccount } = useAccount();

  useEffect(() => {
    console.log('Analytics page - Selected account:', selectedAccount);
    
    const loadTrades = async () => {
      try {
        const storedTrades = localStorage.getItem("trades");
        console.log('Stored trades:', storedTrades);
        
        if (storedTrades) {
          const allTrades = JSON.parse(storedTrades);
          console.log('All trades:', allTrades);
          
          // Filter trades based on selected account
          const filteredTrades = selectedAccount 
            ? allTrades.filter((trade: Trade) => trade.accountId === selectedAccount.id)
            : [];
          console.log('Filtered trades:', filteredTrades);
          
          setTrades(filteredTrades);
        }
      } catch (error) {
        console.error("Error loading trades:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, [selectedAccount]); // Reload trades when account selection changes

  // Calculate key metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  const losingTrades = trades.filter(trade => trade.pnl < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
  const maxDrawdown = calculateMaxDrawdown(trades);
  const profitFactor = calculateProfitFactor(trades);
  const sharpeRatio = calculateSharpeRatio(trades);
  const averageWinLossRatio = calculateAverageWinLossRatio(trades);
  const largestWin = Math.max(...trades.map(t => t.pnl), 0);
  const largestLoss = Math.min(...trades.map(t => t.pnl), 0);
  const consecutiveWins = calculateConsecutiveWins(trades);
  const consecutiveLosses = calculateConsecutiveLosses(trades);

  // Prepare data for charts
  const pnlData = preparePnLData(trades, timeframe);
  const winLossData = prepareWinLossData(trades);
  const strategyData = prepareStrategyData(trades);
  const monthlyPerformance = prepareMonthlyPerformance(trades);
  const riskRewardData = prepareRiskRewardData(trades);
  const timeOfDayData = prepareTimeOfDayData(trades);
  const strategyComparison = prepareStrategyComparison(trades);
  const performanceMetrics = preparePerformanceMetrics(trades);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Account Selected</h2>
          <p className="text-muted-foreground">Please select an account to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Trading Analytics</h1>
            <p className="text-muted-foreground">
              Analysis for {selectedAccount.name}
            </p>
          </div>
          <div className="flex space-x-4">
            <Tabs defaultValue="overview" onValueChange={(value: any) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex space-x-4">
          <Tabs defaultValue="month" onValueChange={(value) => setTimeframe(value as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Overview Section */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalPnL.toFixed(2)}
                </div>
                <div className="flex items-center text-xs">
                  <span className={totalPnL >= 0 ? "text-green-500" : "text-red-500"}>
                    {totalPnL >= 0 ? "+" : ""}{((totalPnL / 1000) * 100).toFixed(1)}% ROI
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {winRate.toFixed(1)}%
                </div>
                <Progress value={winRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profitFactor.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted return
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${maxDrawdown.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Peak to trough
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="bg-gradient-to-br from-gray-900/50 to-gray-900/30">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlData}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#ffffff80" />
                    <YAxis stroke="#ffffff80" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#ffffff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorPnl)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceMetrics}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="metric" stroke="#ffffff80" />
                      <PolarRadiusAxis stroke="#ffffff80" />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Performance Section */}
      {viewMode === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pnl" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategy Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategyComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="strategy" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="winRate" name="Win Rate %" fill="#8884d8" />
                      <Bar dataKey="avgPnl" name="Avg P&L" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Risk Section */}
      {viewMode === "risk" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk/Reward Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="risk" name="Risk" />
                      <YAxis type="number" dataKey="reward" name="Reward" />
                      <ZAxis type="number" dataKey="pnl" name="P&L" />
                      <Tooltip />
                      <Legend />
                      <Scatter data={riskRewardData} fill="#8884d8" name="Trades" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Sharpe Ratio</span>
                      <span className="text-sm font-medium">{sharpeRatio.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(sharpeRatio * 10, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Win/Loss Ratio</span>
                      <span className="text-sm font-medium">{averageWinLossRatio.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(averageWinLossRatio * 20, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Max Drawdown</span>
                      <span className="text-sm font-medium">${maxDrawdown.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min((maxDrawdown / 1000) * 100, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Patterns Section */}
      {viewMode === "patterns" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time of Day Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeOfDayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pnl" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Streaks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Consecutive Wins</span>
                    </div>
                    <Badge variant="success">{consecutiveWins}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span>Consecutive Losses</span>
                    </div>
                    <Badge variant="destructive">{consecutiveLosses}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>Best Trade</span>
                    </div>
                    <span className="text-green-500">${largestWin.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target2 className="h-4 w-4 text-red-500" />
                      <span>Worst Trade</span>
                    </div>
                    <span className="text-red-500">${largestLoss.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for data preparation
function calculateMaxDrawdown(trades: Trade[]): number {
  let peak = 0;
  let maxDrawdown = 0;
  let currentBalance = 0;

  trades.forEach(trade => {
    currentBalance += trade.pnl;
    peak = Math.max(peak, currentBalance);
    maxDrawdown = Math.max(maxDrawdown, peak - currentBalance);
  });

  return maxDrawdown;
}

function calculateProfitFactor(trades: Trade[]): number {
  const grossProfit = trades
    .filter(trade => trade.pnl > 0)
    .reduce((sum, trade) => sum + trade.pnl, 0);
  
  const grossLoss = Math.abs(trades
    .filter(trade => trade.pnl < 0)
    .reduce((sum, trade) => sum + trade.pnl, 0));

  return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
}

function calculateSharpeRatio(trades: Trade[]): number {
  if (trades.length < 2) return 0;
  
  const returns = trades.map(trade => trade.pnl);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length
  );
  
  return stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); // Annualized
}

function calculateAverageWinLossRatio(trades: Trade[]): number {
  const winningTrades = trades.filter(trade => trade.pnl > 0);
  const losingTrades = trades.filter(trade => trade.pnl < 0);
  
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length
    : 0;
  
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length)
    : 0;
  
  return avgLoss === 0 ? avgWin : avgWin / avgLoss;
}

function calculateConsecutiveWins(trades: Trade[]): number {
  let streak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].pnl > 0) streak++;
    else break;
  }
  return streak;
}

function calculateConsecutiveLosses(trades: Trade[]): number {
  let streak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].pnl < 0) streak++;
    else break;
  }
  return streak;
}

function preparePnLData(trades: Trade[], timeframe: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0);
  }

  const filteredTrades = trades.filter(trade => 
    new Date(trade.exitDate) >= startDate
  );

  return filteredTrades.map(trade => ({
    date: new Date(trade.exitDate).toLocaleDateString(),
    pnl: trade.pnl
  }));
}

function prepareWinLossData(trades: Trade[]) {
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  const losingTrades = trades.filter(trade => trade.pnl < 0).length;

  return [
    { name: "Winning Trades", value: winningTrades },
    { name: "Losing Trades", value: losingTrades }
  ];
}

function prepareStrategyData(trades: Trade[]) {
  const strategyMap = new Map<string, number>();
  
  trades.forEach(trade => {
    const strategy = trade.strategy || "Unknown";
    strategyMap.set(strategy, (strategyMap.get(strategy) || 0) + trade.pnl);
  });

  return Array.from(strategyMap.entries()).map(([name, pnl]) => ({
    name,
    pnl
  }));
}

function prepareMonthlyPerformance(trades: Trade[]) {
  const monthlyMap = new Map<string, number>();
  
  trades.forEach(trade => {
    const date = new Date(trade.exitDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + trade.pnl);
  });

  return Array.from(monthlyMap.entries())
    .map(([month, pnl]) => ({
      month,
      pnl
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function prepareRiskRewardData(trades: Trade[]) {
  return trades.map(trade => ({
    risk: Math.abs(trade.entryPrice - trade.stopLoss),
    reward: Math.abs(trade.takeProfit - trade.entryPrice),
    pnl: trade.pnl
  }));
}

function prepareTimeOfDayData(trades: Trade[]) {
  const hourlyMap = new Map<number, number>();
  
  trades.forEach(trade => {
    const hour = new Date(trade.exitDate).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + trade.pnl);
  });

  return Array.from(hourlyMap.entries())
    .map(([hour, pnl]) => ({
      hour: `${hour}:00`,
      pnl
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

function prepareStrategyComparison(trades: Trade[]) {
  const strategyMap = new Map<string, { wins: number; total: number; pnl: number }>();
  
  trades.forEach(trade => {
    const strategy = trade.strategy || "Unknown";
    const stats = strategyMap.get(strategy) || { wins: 0, total: 0, pnl: 0 };
    stats.total++;
    if (trade.pnl > 0) stats.wins++;
    stats.pnl += trade.pnl;
    strategyMap.set(strategy, stats);
  });

  return Array.from(strategyMap.entries()).map(([strategy, stats]) => ({
    strategy,
    winRate: (stats.wins / stats.total) * 100,
    avgPnl: stats.pnl / stats.total
  }));
}

function preparePerformanceMetrics(trades: Trade[]) {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const profitFactor = calculateProfitFactor(trades);
  const sharpeRatio = calculateSharpeRatio(trades);
  const averageWinLossRatio = calculateAverageWinLossRatio(trades);
  const maxDrawdown = calculateMaxDrawdown(trades);

  return [
    { metric: "Win Rate", value: winRate },
    { metric: "Profit Factor", value: profitFactor * 10 },
    { metric: "Sharpe Ratio", value: sharpeRatio * 10 },
    { metric: "Win/Loss Ratio", value: averageWinLossRatio * 10 },
    { metric: "Risk Management", value: Math.max(0, 100 - (maxDrawdown / 1000) * 100) },
  ];
} 