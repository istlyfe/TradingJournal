"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TradePatternAnalysisProps {
  trades: Record<string, Trade>;
  timeframe: string;
}

export default function TradePatternAnalysis({ trades, timeframe }: TradePatternAnalysisProps) {
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState("strategy");

  // Colors for the charts
  const COLORS = {
    positive: '#10b981', // Green
    negative: '#ef4444', // Red
    neutral: '#6b7280', // Gray
    bars: [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#6366f1', '#d946ef', '#f43f5e', '#a3e635', '#06b6d4'
    ]
  };

  useEffect(() => {
    // Convert trades object to array and filter if needed
    const tradesArray = Object.values(trades);
    setFilteredTrades(tradesArray);
  }, [trades, timeframe]);

  // Analyze strategies
  const getStrategyData = () => {
    // Group trades by strategy
    const strategyGroups: Record<string, { count: number; pnl: number; winRate: number }> = {};
    
    filteredTrades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategyGroups[strategy]) {
        strategyGroups[strategy] = { count: 0, pnl: 0, winRate: 0 };
      }
      
      strategyGroups[strategy].count += 1;
      strategyGroups[strategy].pnl += (trade.pnl || 0);
    });
    
    // Calculate win rate for each strategy
    Object.keys(strategyGroups).forEach(strategy => {
      const strategyTrades = filteredTrades.filter(t => (t.strategy || 'Unknown') === strategy);
      const wins = strategyTrades.filter(t => (t.pnl || 0) > 0).length;
      strategyGroups[strategy].winRate = (wins / strategyTrades.length) * 100;
    });
    
    // Convert to array for the chart
    return Object.entries(strategyGroups)
      .map(([strategy, data]) => ({
        name: strategy,
        count: data.count,
        pnl: data.pnl,
        winRate: data.winRate.toFixed(1),
      }))
      .sort((a, b) => b.pnl - a.pnl); // Sort by P&L
  };

  // Analyze mistakes
  const getMistakeData = () => {
    // Group trades by mistake type
    const mistakeGroups: Record<string, { count: number; pnl: number }> = {};
    
    filteredTrades
      .filter(trade => trade.mistakes && trade.mistakes.length > 0)
      .forEach(trade => {
        const mistake = trade.mistakes || 'Unknown';
        if (!mistakeGroups[mistake]) {
          mistakeGroups[mistake] = { count: 0, pnl: 0 };
        }
        
        mistakeGroups[mistake].count += 1;
        mistakeGroups[mistake].pnl += (trade.pnl || 0);
      });
    
    // Convert to array for the chart
    return Object.entries(mistakeGroups)
      .map(([mistake, data]) => ({
        name: mistake,
        count: data.count,
        pnl: data.pnl,
      }))
      .sort((a, b) => a.pnl - b.pnl); // Sort by P&L (worst first)
  };

  // Analyze emotional states
  const getEmotionalStateData = () => {
    // Group trades by emotional state
    const emotionGroups: Record<string, { count: number; pnl: number; avgPnl: number }> = {};
    
    filteredTrades
      .filter(trade => trade.emotionalState)
      .forEach(trade => {
        const emotion = trade.emotionalState || 'Unknown';
        if (!emotionGroups[emotion]) {
          emotionGroups[emotion] = { count: 0, pnl: 0, avgPnl: 0 };
        }
        
        emotionGroups[emotion].count += 1;
        emotionGroups[emotion].pnl += (trade.pnl || 0);
      });
    
    // Calculate average P&L for each emotion
    Object.keys(emotionGroups).forEach(emotion => {
      emotionGroups[emotion].avgPnl = emotionGroups[emotion].pnl / emotionGroups[emotion].count;
    });
    
    // Convert to array for the chart
    return Object.entries(emotionGroups)
      .map(([emotion, data]) => ({
        name: emotion,
        count: data.count,
        pnl: data.pnl,
        avgPnl: data.avgPnl,
      }))
      .sort((a, b) => b.avgPnl - a.avgPnl); // Sort by average P&L
  };

  // Analyze trade setups
  const getTradeSetupData = () => {
    // Group trades by setup
    const setupGroups: Record<string, { count: number; pnl: number; winRate: number }> = {};
    
    filteredTrades
      .filter(trade => trade.tradeSetup)
      .forEach(trade => {
        const setup = trade.tradeSetup || 'Unknown';
        if (!setupGroups[setup]) {
          setupGroups[setup] = { count: 0, pnl: 0, winRate: 0 };
        }
        
        setupGroups[setup].count += 1;
        setupGroups[setup].pnl += (trade.pnl || 0);
      });
    
    // Calculate win rate for each setup
    Object.keys(setupGroups).forEach(setup => {
      const setupTrades = filteredTrades.filter(t => (t.tradeSetup || 'Unknown') === setup);
      const wins = setupTrades.filter(t => (t.pnl || 0) > 0).length;
      setupGroups[setup].winRate = (wins / setupTrades.length) * 100;
    });
    
    // Convert to array for the chart
    return Object.entries(setupGroups)
      .map(([setup, data]) => ({
        name: setup,
        count: data.count,
        pnl: data.pnl,
        winRate: data.winRate.toFixed(1),
      }))
      .sort((a, b) => b.pnl - a.pnl); // Sort by P&L
  };

  // Get data for the current active tab
  const getChartData = () => {
    switch (activeTab) {
      case 'strategy':
        return getStrategyData();
      case 'mistakes':
        return getMistakeData();
      case 'emotions':
        return getEmotionalStateData();
      case 'setups':
        return getTradeSetupData();
      default:
        return [];
    }
  };

  const chartData = getChartData();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Trade Pattern Analysis</CardTitle>
        <CardDescription>
          Analyze your trading patterns to identify strengths and weaknesses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="setups">Setups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategy" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'pnl') return formatCurrency(Number(value));
                      if (name === 'winRate') return `${value}%`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="pnl" 
                    name="P&L" 
                    fill="#3b82f6"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.positive : COLORS.negative} />
                    ))}
                  </Bar>
                  <Bar 
                    yAxisId="right" 
                    dataKey="count" 
                    name="Trade Count" 
                    fill="#8b5cf6" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Best Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">{chartData[0]?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData[0]?.pnl || 0)} ({chartData[0]?.count} trades)
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Highest Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chartData.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]?.winRate}% win rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Traded</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.count} trades
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No strategy data available. Add strategy details to your trades.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mistakes" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'pnl') return formatCurrency(Number(value));
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="pnl" 
                    name="P&L Impact" 
                    fill="#ef4444"
                  />
                  <Bar 
                    dataKey="count" 
                    name="Occurrence Count" 
                    fill="#f59e0b" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Costly Mistake</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg text-red-500">{chartData[0]?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData[0]?.pnl || 0)} cost across {chartData[0]?.count} occurrences
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Frequent Mistake</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.count} occurrences
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No mistake data available. Track mistakes in your trades to see analysis.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="emotions" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'avgPnl') return formatCurrency(Number(value));
                      if (name === 'pnl') return formatCurrency(Number(value));
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="avgPnl" 
                    name="Average P&L" 
                    fill="#10b981"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? COLORS.positive : COLORS.negative} />
                    ))}
                  </Bar>
                  <Bar 
                    yAxisId="right" 
                    dataKey="count" 
                    name="Trade Count" 
                    fill="#6366f1" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Best Emotional State</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">{chartData[0]?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg P&L: {formatCurrency(chartData[0]?.avgPnl || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Worst Emotional State</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg text-red-500">
                      {chartData[chartData.length - 1]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg P&L: {formatCurrency(chartData[chartData.length - 1]?.avgPnl || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Common State</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chartData.sort((a, b) => b.count - a.count)[0]?.count} trades
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No emotional state data available. Track your emotional state during trades.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="setups" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'pnl') return formatCurrency(Number(value));
                      if (name === 'winRate') return `${value}%`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="pnl" 
                    name="Total P&L" 
                    fill="#3b82f6"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS.positive : COLORS.negative} />
                    ))}
                  </Bar>
                  <Bar 
                    yAxisId="right" 
                    dataKey="winRate" 
                    name="Win Rate %" 
                    fill="#8b5cf6" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Profitable Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">{chartData[0]?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData[0]?.pnl || 0)} ({chartData[0]?.count} trades)
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Highest Win Rate Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chartData.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]?.winRate}% win rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Least Profitable Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg text-red-500">
                      {chartData[chartData.length - 1]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData[chartData.length - 1]?.pnl || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No setup data available. Add trade setup details to your trades.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 