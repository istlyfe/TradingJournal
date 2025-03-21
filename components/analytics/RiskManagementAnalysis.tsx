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
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';

interface RiskManagementAnalysisProps {
  trades: Record<string, Trade>;
  timeframe: string;
}

export default function RiskManagementAnalysis({ trades, timeframe }: RiskManagementAnalysisProps) {
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState("riskReward");

  // Colors for the charts
  const COLORS = {
    positive: '#10b981', // Green
    negative: '#ef4444', // Red
    neutral: '#6b7280', // Gray
    pie: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']
  };

  useEffect(() => {
    // Convert trades object to array and filter if needed
    const tradesArray = Object.values(trades);
    setFilteredTrades(tradesArray);
  }, [trades, timeframe]);

  // Calculate risk-reward ratio distribution
  const getRiskRewardData = () => {
    const tradesWithRR = filteredTrades.filter(
      trade => trade.stopLoss !== undefined && trade.takeProfit !== undefined
    );
    
    if (tradesWithRR.length === 0) return [];
    
    // Calculate R:R ratio for each trade
    const rrValues = tradesWithRR.map(trade => {
      const risk = Math.abs(trade.entryPrice - (trade.stopLoss || 0));
      const reward = Math.abs((trade.takeProfit || 0) - trade.entryPrice);
      return {
        id: trade.id,
        symbol: trade.symbol,
        ratio: risk === 0 ? 0 : parseFloat((reward / risk).toFixed(2)),
        pnl: trade.pnl || 0
      };
    });
    
    // Group by ratio ranges
    const ranges = [
      { name: "< 1:1", min: 0, max: 1 },
      { name: "1:1 - 1.5:1", min: 1, max: 1.5 },
      { name: "1.5:1 - 2:1", min: 1.5, max: 2 },
      { name: "2:1 - 3:1", min: 2, max: 3 },
      { name: "3:1 - 5:1", min: 3, max: 5 },
      { name: "> 5:1", min: 5, max: Infinity }
    ];
    
    return ranges.map(range => {
      const tradesInRange = rrValues.filter(
        trade => trade.ratio >= range.min && trade.ratio < range.max
      );
      
      const totalPnl = tradesInRange.reduce((sum, trade) => sum + trade.pnl, 0);
      const wins = tradesInRange.filter(trade => trade.pnl > 0).length;
      const winRate = tradesInRange.length > 0 ? (wins / tradesInRange.length) * 100 : 0;
      
      return {
        name: range.name,
        count: tradesInRange.length,
        pnl: totalPnl,
        winRate: parseFloat(winRate.toFixed(1))
      };
    }).filter(item => item.count > 0);
  };

  // Calculate win rate by market condition
  const getMarketConditionData = () => {
    const tradesWithCondition = filteredTrades.filter(trade => trade.marketCondition);
    
    if (tradesWithCondition.length === 0) return [];
    
    // Group by market condition
    const conditionGroups: Record<string, { count: number; wins: number; pnl: number }> = {};
    
    tradesWithCondition.forEach(trade => {
      const condition = trade.marketCondition || 'Unknown';
      if (!conditionGroups[condition]) {
        conditionGroups[condition] = { count: 0, wins: 0, pnl: 0 };
      }
      
      conditionGroups[condition].count += 1;
      conditionGroups[condition].pnl += (trade.pnl || 0);
      if ((trade.pnl || 0) > 0) {
        conditionGroups[condition].wins += 1;
      }
    });
    
    // Convert to array for the chart
    return Object.entries(conditionGroups)
      .map(([condition, data]) => ({
        name: condition,
        count: data.count,
        pnl: data.pnl,
        winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1))
      }))
      .sort((a, b) => b.winRate - a.winRate);
  };

  // Analyze stop loss hit frequency
  const getStopLossAnalysis = () => {
    // For this analysis, we'll consider trades where the maxAdverseExcursion is past the stop loss
    const tradesWithStops = filteredTrades.filter(
      trade => trade.stopLoss !== undefined && trade.maxAdverseExcursion !== undefined
    );
    
    if (tradesWithStops.length === 0) return { stopHits: 0, total: 0, percent: 0, data: [] };
    
    // Count how many trades hit stop loss
    const stopHits = tradesWithStops.filter(trade => {
      const isLong = trade.direction === 'LONG';
      const stopPrice = trade.stopLoss || 0;
      const maxExcursion = trade.maxAdverseExcursion || 0;
      
      // For longs, price going below stop means stop was hit
      // For shorts, price going above stop means stop was hit
      return isLong 
        ? maxExcursion <= stopPrice 
        : maxExcursion >= stopPrice;
    });
    
    // Group by outcome (stop hit vs not hit) for pie chart
    const data = [
      { 
        name: "Stop Hit", 
        value: stopHits.length,
        pnl: stopHits.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      },
      { 
        name: "Stop Not Hit", 
        value: tradesWithStops.length - stopHits.length,
        pnl: tradesWithStops
          .filter(t => !stopHits.some(s => s.id === t.id))
          .reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      }
    ];
    
    return {
      stopHits: stopHits.length,
      total: tradesWithStops.length,
      percent: parseFloat(((stopHits.length / tradesWithStops.length) * 100).toFixed(1)),
      data
    };
  };

  // Analyze consistency of trade sizing
  const getTradeVolatilityData = () => {
    if (filteredTrades.length < 5) return { cv: 0, data: [] };
    
    // Calculate trade size volatility (coefficient of variation)
    const tradeSizes = filteredTrades.map(trade => trade.quantity);
    const mean = tradeSizes.reduce((sum, size) => sum + size, 0) / tradeSizes.length;
    const variance = tradeSizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / tradeSizes.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coefficient of variation as percentage
    
    // Create a time series of trade sizes
    const sizeData = filteredTrades
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
      .map((trade, i) => ({
        index: i + 1,
        date: new Date(trade.entryDate).toLocaleDateString(),
        size: trade.quantity,
        symbol: trade.symbol,
        pnl: trade.pnl || 0
      }));
    
    return { cv: parseFloat(cv.toFixed(1)), data: sizeData };
  };

  // Get data for the current active tab
  const getChartData = () => {
    switch (activeTab) {
      case 'riskReward':
        return getRiskRewardData();
      case 'marketCondition':
        return getMarketConditionData();
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const stopLossAnalysis = getStopLossAnalysis();
  const tradeVolatility = getTradeVolatilityData();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Risk Management Analysis</CardTitle>
        <CardDescription>
          Analyze your risk parameters and how they affect your trading performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="riskReward">Risk-Reward</TabsTrigger>
            <TabsTrigger value="marketCondition">Market Conditions</TabsTrigger>
            <TabsTrigger value="stopManagement">Stop Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="riskReward" className="space-y-4">
            <div className="h-80">
              {chartData.length > 0 ? (
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
                      height={60}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'pnl') return [formatCurrency(Number(value)), "P&L"];
                        if (name === 'winRate') return [`${value}%`, "Win Rate"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="count" 
                      name="Trade Count" 
                      fill="#8b5cf6" 
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="winRate" 
                      name="Win Rate %" 
                      fill={COLORS.positive}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    No risk-reward data available. Add stop loss and take profit targets to your trades.
                  </p>
                </div>
              )}
            </div>
            
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Best Risk-Reward</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.winRate - a.winRate)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Win Rate: {chartData.sort((a, b) => b.winRate - a.winRate)[0]?.winRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Profitable R:R</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.pnl - a.pnl)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData.sort((a, b) => b.pnl - a.pnl)[0]?.pnl || 0)} total P&L
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Common R:R</CardTitle>
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
            )}
          </TabsContent>
          
          <TabsContent value="marketCondition" className="space-y-4">
            <div className="h-80">
              {chartData.length > 0 ? (
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
                      height={60}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'pnl') return [formatCurrency(Number(value)), "P&L"];
                        if (name === 'winRate') return [`${value}%`, "Win Rate"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="winRate" 
                      name="Win Rate %" 
                      fill={COLORS.positive}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="count" 
                      name="Trade Count" 
                      fill="#8b5cf6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    No market condition data available. Add market conditions to your trades.
                  </p>
                </div>
              )}
            </div>
            
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Best Market Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Win Rate: {chartData[0]?.winRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Traded Condition</CardTitle>
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
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Most Profitable Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-lg">
                      {chartData.sort((a, b) => b.pnl - a.pnl)[0]?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(chartData.sort((a, b) => b.pnl - a.pnl)[0]?.pnl || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stopManagement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Stop Loss Hit Frequency</h3>
                <div className="h-64">
                  {stopLossAnalysis.total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stopLossAnalysis.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {stopLossAnalysis.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const entry = props.payload;
                            if (entry && entry.pnl !== undefined) {
                              return [`${value} trades (${formatCurrency(entry.pnl)})`, name];
                            }
                            return [value, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        No stop loss data available. Add stop loss and max adverse excursion to your trades.
                      </p>
                    </div>
                  )}
                </div>
                {stopLossAnalysis.total > 0 && (
                  <div className="text-center mt-2">
                    <p className="text-sm">
                      {stopLossAnalysis.stopHits} out of {stopLossAnalysis.total} trades hit their stop loss ({stopLossAnalysis.percent}%)
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Position Size Consistency</h3>
                <div className="h-64">
                  {tradeVolatility.data.length > 4 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={tradeVolatility.data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name, props) => {
                            if (name === 'size') {
                              const entry = props.payload;
                              return [`${value} contracts/shares (${entry?.symbol})`, "Position Size"];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(value) => `Trade #${value}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="size"
                          name="Position Size"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Not enough trade data to analyze position sizing consistency.
                      </p>
                    </div>
                  )}
                </div>
                {tradeVolatility.data.length > 4 && (
                  <div className="text-center mt-2">
                    <p className="text-sm">
                      Position Size Volatility: {tradeVolatility.cv}%
                      {tradeVolatility.cv > 50 ? " (High)" : tradeVolatility.cv > 25 ? " (Moderate)" : " (Low)"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower volatility suggests more consistent position sizing
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 