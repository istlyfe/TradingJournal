import { Trade } from "@/types/trade";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

export interface TradingMetrics {
  // Overview
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  
  // Risk Metrics
  riskRewardRatio: number;
  maxDrawdown: number;
  averageRiskPerTrade: number;
  drawdownHistory: Array<{
    date: string;
    value: number;
  }>;
  positionSizes: Array<{
    size: string;
    count: number;
  }>;
  
  // Trading Patterns
  bestTradingDays: Array<{
    name: string;
    winRate: number;
  }>;
  bestTradingHours: Array<{
    time: string;
    winRate: number;
  }>;
  setupPerformance: Array<{
    name: string;
    winRate: number;
    profit: number;
  }>;
  
  // Psychological
  moodPerformance: Array<{
    mood: string;
    winRate: number;
    profit: number;
  }>;
  consistencyScore: Array<{
    date: string;
    value: number;
  }>;
  
  // Monthly Performance
  monthlyPnL: Array<{
    month: string;
    value: number;
  }>;
}

export function calculateMetrics(trades: Trade[], selectedAccounts: string[]): TradingMetrics {
  // Filter trades by selected accounts
  const filteredTrades = trades.filter(trade => 
    selectedAccounts.includes(trade.accountId)
  );
  
  // Calculate win rate
  const winningTrades = filteredTrades.filter(trade => trade.pnl > 0);
  const winRate = (winningTrades.length / filteredTrades.length) * 100;
  
  // Calculate profits and losses
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const losingTrades = filteredTrades.filter(trade => trade.pnl <= 0);
  const totalLoss = losingTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const netProfit = totalProfit + totalLoss;
  
  // Calculate profit factor
  const profitFactor = Math.abs(totalProfit / totalLoss);
  
  // Calculate risk metrics
  const riskRewardRatio = calculateRiskRewardRatio(filteredTrades);
  const { maxDrawdown, drawdownHistory } = calculateDrawdown(filteredTrades);
  const positionSizes = calculatePositionSizes(filteredTrades);
  
  // Calculate trading patterns
  const bestTradingDays = calculateBestTradingDays(filteredTrades);
  const bestTradingHours = calculateBestTradingHours(filteredTrades);
  const setupPerformance = calculateSetupPerformance(filteredTrades);
  
  // Calculate psychological metrics
  const moodPerformance = calculateMoodPerformance(filteredTrades);
  const consistencyScore = calculateConsistencyScore(filteredTrades);
  
  // Calculate monthly P&L
  const monthlyPnL = calculateMonthlyPnL(filteredTrades);
  
  return {
    winRate,
    totalProfit,
    totalLoss,
    netProfit,
    profitFactor,
    riskRewardRatio,
    maxDrawdown,
    averageRiskPerTrade: calculateAverageRisk(filteredTrades),
    drawdownHistory,
    positionSizes,
    bestTradingDays,
    bestTradingHours,
    setupPerformance,
    moodPerformance,
    consistencyScore,
    monthlyPnL,
  };
}

function calculateRiskRewardRatio(trades: Trade[]): number {
  const winningTrades = trades.filter(trade => trade.pnl > 0);
  const losingTrades = trades.filter(trade => trade.pnl <= 0);
  
  const avgWin = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length;
  const avgLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length);
  
  return avgWin / avgLoss;
}

function calculateDrawdown(trades: Trade[]): { maxDrawdown: number; drawdownHistory: any[] } {
  let peak = 0;
  let maxDrawdown = 0;
  let currentBalance = 0;
  const drawdownHistory = [];
  
  for (const trade of trades) {
    currentBalance += trade.pnl;
    peak = Math.max(peak, currentBalance);
    const drawdown = ((peak - currentBalance) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    
    drawdownHistory.push({
      date: format(parseISO(trade.exitDate), "MMM d"),
      value: drawdown,
    });
  }
  
  return { maxDrawdown, drawdownHistory };
}

function calculatePositionSizes(trades: Trade[]): any[] {
  const sizes: { [key: string]: number } = {};
  
  trades.forEach(trade => {
    const size = Math.floor(trade.quantity * trade.entryPrice / 1000) * 1000;
    const sizeKey = `$${(size / 1000)}k`;
    sizes[sizeKey] = (sizes[sizeKey] || 0) + 1;
  });
  
  return Object.entries(sizes).map(([size, count]) => ({
    size,
    count,
  }));
}

function calculateBestTradingDays(trades: Trade[]): any[] {
  const days: { [key: string]: { wins: number; total: number } } = {};
  
  trades.forEach(trade => {
    const day = format(parseISO(trade.entryDate), "EEEE");
    if (!days[day]) days[day] = { wins: 0, total: 0 };
    days[day].total++;
    if (trade.pnl > 0) days[day].wins++;
  });
  
  return Object.entries(days)
    .map(([name, stats]) => ({
      name,
      winRate: (stats.wins / stats.total) * 100,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

function calculateBestTradingHours(trades: Trade[]): any[] {
  const hours: { [key: string]: { wins: number; total: number } } = {};
  
  trades.forEach(trade => {
    const hour = format(parseISO(trade.entryDate), "HH:mm");
    if (!hours[hour]) hours[hour] = { wins: 0, total: 0 };
    hours[hour].total++;
    if (trade.pnl > 0) hours[hour].wins++;
  });
  
  return Object.entries(hours)
    .map(([time, stats]) => ({
      time,
      winRate: (stats.wins / stats.total) * 100,
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);
}

function calculateSetupPerformance(trades: Trade[]): any[] {
  const setups: { [key: string]: { wins: number; total: number; profit: number } } = {};
  
  trades.forEach(trade => {
    const setup = trade.setup || "Other";
    if (!setups[setup]) setups[setup] = { wins: 0, total: 0, profit: 0 };
    setups[setup].total++;
    if (trade.pnl > 0) setups[setup].wins++;
    setups[setup].profit += trade.pnl;
  });
  
  return Object.entries(setups)
    .map(([name, stats]) => ({
      name,
      winRate: (stats.wins / stats.total) * 100,
      profit: stats.profit,
    }))
    .sort((a, b) => b.profit - a.profit);
}

function calculateMoodPerformance(trades: Trade[]): any[] {
  const moods: { [key: string]: { wins: number; total: number; profit: number } } = {};
  
  trades.forEach(trade => {
    if (!trade.mood) return;
    if (!moods[trade.mood]) moods[trade.mood] = { wins: 0, total: 0, profit: 0 };
    moods[trade.mood].total++;
    if (trade.pnl > 0) moods[trade.mood].wins++;
    moods[trade.mood].profit += trade.pnl;
  });
  
  return Object.entries(moods)
    .map(([mood, stats]) => ({
      mood,
      winRate: (stats.wins / stats.total) * 100,
      profit: stats.profit,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

function calculateConsistencyScore(trades: Trade[]): any[] {
  const scores = [];
  let runningScore = 50; // Start at neutral
  
  trades.forEach(trade => {
    // Adjust score based on trade performance
    if (trade.pnl > 0) {
      runningScore += 5; // Increase score for winning trade
    } else {
      runningScore -= 5; // Decrease score for losing trade
    }
    
    // Keep score between 0 and 100
    runningScore = Math.max(0, Math.min(100, runningScore));
    
    scores.push({
      date: format(parseISO(trade.exitDate), "MMM d"),
      value: runningScore,
    });
  });
  
  return scores;
}

function calculateMonthlyPnL(trades: Trade[]): any[] {
  const monthlyData: { [key: string]: number } = {};
  
  trades.forEach(trade => {
    const month = format(parseISO(trade.exitDate), "MMM yyyy");
    monthlyData[month] = (monthlyData[month] || 0) + trade.pnl;
  });
  
  return Object.entries(monthlyData)
    .map(([month, value]) => ({
      month,
      value,
    }))
    .sort((a, b) => parseISO(a.month).getTime() - parseISO(b.month).getTime());
}

function calculateAverageRisk(trades: Trade[]): number {
  return trades.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0) / trades.length;
} 