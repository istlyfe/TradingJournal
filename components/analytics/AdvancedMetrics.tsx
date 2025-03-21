"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";

interface AdvancedMetricsProps {
  trades: Record<string, Trade>;
  timeframe: string;
}

export default function AdvancedMetrics({ trades, timeframe }: AdvancedMetricsProps) {
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Convert trades object to array and filter if needed
    const tradesArray = Object.values(trades);
    setFilteredTrades(tradesArray);
  }, [trades, timeframe]);

  // Calculate profit factor (gross profits / gross losses)
  const calculateProfitFactor = (): number => {
    const grossProfit = filteredTrades
      .filter(trade => (trade.pnl || 0) > 0)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const grossLoss = Math.abs(
      filteredTrades
        .filter(trade => (trade.pnl || 0) < 0)
        .reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    );
    
    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  };
  
  // Calculate expectancy (average R multiple)
  const calculateExpectancy = (): number => {
    // Filter trades that have both stopLoss and pnl values
    const tradesWithRisk = filteredTrades.filter(
      trade => trade.stopLoss !== undefined && trade.pnl !== undefined
    );
    
    if (tradesWithRisk.length === 0) return 0;
    
    // Calculate R-multiples (profit or loss divided by risk)
    const rMultiples = tradesWithRisk.map(trade => {
      const entryPrice = trade.entryPrice;
      const stopLoss = trade.stopLoss || 0;
      
      // Calculate initial risk in dollars
      const riskPerShare = Math.abs(entryPrice - stopLoss);
      const totalRisk = riskPerShare * trade.quantity * (trade.contractMultiplier || 1);
      
      // Calculate R-multiple (pnl / risk)
      return totalRisk === 0 ? 0 : (trade.pnl || 0) / totalRisk;
    });
    
    // Calculate average R-multiple
    const sumRMultiples = rMultiples.reduce((sum, r) => sum + r, 0);
    return sumRMultiples / rMultiples.length;
  };
  
  // Calculating win rate
  const calculateWinRate = (): number => {
    if (filteredTrades.length === 0) return 0;
    
    const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0);
    return (winningTrades.length / filteredTrades.length) * 100;
  };
  
  // Calculate average risk-reward ratio
  const calculateAverageRiskReward = (): number => {
    const tradesWithTargets = filteredTrades.filter(
      trade => trade.takeProfit !== undefined && trade.stopLoss !== undefined
    );
    
    if (tradesWithTargets.length === 0) return 0;
    
    const riskRewardRatios = tradesWithTargets.map(trade => {
      const entryPrice = trade.entryPrice;
      const stopLoss = trade.stopLoss || 0;
      const takeProfit = trade.takeProfit || 0;
      
      // Calculate risk and reward in points
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
      
      return risk === 0 ? 0 : reward / risk;
    });
    
    const sumRatios = riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0);
    return sumRatios / riskRewardRatios.length;
  };
  
  // Calculate maximum drawdown
  const calculateMaxDrawdown = (): number => {
    if (filteredTrades.length === 0) return 0;
    
    // Sort trades by date
    const sortedTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    // Calculate cumulative P&L
    let cumulativePnL = 0;
    const equityCurve = sortedTrades.map(trade => {
      cumulativePnL += (trade.pnl || 0);
      return cumulativePnL;
    });
    
    // Find maximum drawdown
    let maxDrawdown = 0;
    let peak = 0;
    
    for (let i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
      }
      
      const drawdown = peak - equityCurve[i];
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  };
  
  // Calculate average MAE and MFE (Maximum Adverse/Favorable Excursion)
  const calculateExcursions = () => {
    const tradesWithExcursions = filteredTrades.filter(
      trade => trade.maxAdverseExcursion !== undefined && trade.maxFavorableExcursion !== undefined
    );
    
    if (tradesWithExcursions.length === 0) return { avgMAE: 0, avgMFE: 0 };
    
    const totalMAE = tradesWithExcursions.reduce(
      (sum, trade) => sum + Math.abs((trade.maxAdverseExcursion || 0) - trade.entryPrice), 0
    );
    
    const totalMFE = tradesWithExcursions.reduce(
      (sum, trade) => sum + Math.abs((trade.maxFavorableExcursion || 0) - trade.entryPrice), 0
    );
    
    return {
      avgMAE: totalMAE / tradesWithExcursions.length,
      avgMFE: totalMFE / tradesWithExcursions.length
    };
  };
  
  const { avgMAE, avgMFE } = calculateExcursions();
  const profitFactor = calculateProfitFactor();
  const expectancy = calculateExpectancy();
  const winRate = calculateWinRate();
  const avgRiskReward = calculateAverageRiskReward();
  const maxDrawdown = calculateMaxDrawdown();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Advanced Metrics</CardTitle>
        <CardDescription>
          Key performance indicators to help you understand your trading edge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {profitFactor.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ratio of gross profits to gross losses. Above 1.5 is good, above 2.0 is excellent.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentage of trades that are profitable
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Expectancy (R)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {expectancy.toFixed(2)}R
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average return per unit of risk. Above 0.5R is good.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(maxDrawdown)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Largest drop from peak to trough in account equity
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Avg Risk/Reward</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    1:{avgRiskReward.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average ratio of potential reward to risk
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Largest Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(
                      Math.min(...filteredTrades.map(trade => trade.pnl || 0))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Largest single trade loss
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="execution" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Avg Adverse Excursion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avgMAE.toFixed(2)} pts
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average maximum move against your position
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Avg Favorable Excursion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avgMFE.toFixed(2)} pts
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average maximum move in your favor
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Left on Table %</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avgMFE === 0 ? "0%" : ((avgMFE - avgMAE) / avgMFE * 100).toFixed(1) + "%"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentage of potential profit not captured
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 