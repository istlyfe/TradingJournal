import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(accessToken);

    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the query filter
    const whereFilter: any = {
      userId: decoded.userId,
    };
    
    if (accountId) {
      whereFilter.accountId = accountId;
    }
    
    // Add date filters if provided
    if (startDate || endDate) {
      whereFilter.entryDate = {};
      
      if (startDate) {
        whereFilter.entryDate.gte = new Date(startDate);
      }
      
      if (endDate) {
        whereFilter.entryDate.lte = new Date(endDate);
      }
    }

    // Get all trades that match the filters
    const trades = await prisma.trade.findMany({
      where: whereFilter,
      include: {
        account: true,
      },
    });

    // Calculate statistics
    const totalTrades = trades.length;
    const closedTrades = trades.filter(t => t.exitDate !== null).length;
    const openTrades = totalTrades - closedTrades;
    
    // Calculate profit/loss metrics
    const winningTrades = trades.filter(t => t.exitDate !== null && t.pnl > 0);
    const losingTrades = trades.filter(t => t.exitDate !== null && t.pnl < 0);
    const breakEvenTrades = trades.filter(t => t.exitDate !== null && t.pnl === 0);
    
    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const breakEvenCount = breakEvenTrades.length;
    
    const winRate = closedTrades > 0 ? (winCount / closedTrades) * 100 : 0;
    const lossRate = closedTrades > 0 ? (lossCount / closedTrades) * 100 : 0;
    const breakEvenRate = closedTrades > 0 ? (breakEvenCount / closedTrades) * 100 : 0;
    
    // Calculate total profit/loss
    const totalPnl = trades
      .filter(t => t.exitDate !== null)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const totalWinAmount = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLossAmount = losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    // Calculate averages
    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? Math.abs(totalLossAmount) / lossCount : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    // Calculate largest win and loss
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.pnl || 0)) 
      : 0;
    
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.pnl || 0)) 
      : 0;
    
    // Group trades by symbol
    const symbolStats = trades.reduce((acc: any, trade) => {
      const symbol = trade.symbol;
      
      if (!acc[symbol]) {
        acc[symbol] = {
          totalTrades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
          winRate: 0,
        };
      }
      
      acc[symbol].totalTrades += 1;
      
      if (trade.exitDate) {
        if (trade.pnl > 0) {
          acc[symbol].wins += 1;
        } else if (trade.pnl < 0) {
          acc[symbol].losses += 1;
        }
        
        acc[symbol].pnl += trade.pnl || 0;
      }
      
      // Calculate win rate for each symbol
      const symbolTotalClosed = acc[symbol].wins + acc[symbol].losses;
      acc[symbol].winRate = symbolTotalClosed > 0 
        ? (acc[symbol].wins / symbolTotalClosed) * 100 
        : 0;
      
      return acc;
    }, {});
    
    // Group trades by strategy
    const strategyStats = trades.reduce((acc: any, trade) => {
      const strategy = trade.strategy || 'Unspecified';
      
      if (!acc[strategy]) {
        acc[strategy] = {
          totalTrades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
          winRate: 0,
        };
      }
      
      acc[strategy].totalTrades += 1;
      
      if (trade.exitDate) {
        if (trade.pnl > 0) {
          acc[strategy].wins += 1;
        } else if (trade.pnl < 0) {
          acc[strategy].losses += 1;
        }
        
        acc[strategy].pnl += trade.pnl || 0;
      }
      
      // Calculate win rate for each strategy
      const strategyTotalClosed = acc[strategy].wins + acc[strategy].losses;
      acc[strategy].winRate = strategyTotalClosed > 0 
        ? (acc[strategy].wins / strategyTotalClosed) * 100 
        : 0;
      
      return acc;
    }, {});
    
    // Format symbol and strategy stats as arrays for easier frontend use
    const symbolStatsArray = Object.entries(symbolStats).map(([symbol, stats]) => ({
      symbol,
      ...stats,
    }));
    
    const strategyStatsArray = Object.entries(strategyStats).map(([strategy, stats]) => ({
      strategy,
      ...stats,
    }));
    
    // Calculate trade distribution by time
    const timeDistribution = trades.reduce((acc: any, trade) => {
      if (trade.entryDate) {
        const date = new Date(trade.entryDate);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const month = date.getMonth();
        
        // By hour
        if (!acc.byHour[hour]) {
          acc.byHour[hour] = { count: 0, pnl: 0 };
        }
        acc.byHour[hour].count += 1;
        if (trade.exitDate) {
          acc.byHour[hour].pnl += trade.pnl || 0;
        }
        
        // By day of week
        if (!acc.byDayOfWeek[dayOfWeek]) {
          acc.byDayOfWeek[dayOfWeek] = { count: 0, pnl: 0 };
        }
        acc.byDayOfWeek[dayOfWeek].count += 1;
        if (trade.exitDate) {
          acc.byDayOfWeek[dayOfWeek].pnl += trade.pnl || 0;
        }
        
        // By month
        if (!acc.byMonth[month]) {
          acc.byMonth[month] = { count: 0, pnl: 0 };
        }
        acc.byMonth[month].count += 1;
        if (trade.exitDate) {
          acc.byMonth[month].pnl += trade.pnl || 0;
        }
      }
      
      return acc;
    }, {
      byHour: {},
      byDayOfWeek: {},
      byMonth: {},
    });
    
    // Calculate consecutive wins and losses
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreakType: 'win' | 'loss' | null = null;
    
    // Sort trades by entry date for streak calculation
    const sortedTrades = [...trades]
      .filter(t => t.exitDate !== null)
      .sort((a, b) => 
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );
    
    sortedTrades.forEach(trade => {
      if (trade.pnl > 0) {
        if (currentStreakType === 'win') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'win';
        }
        
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (trade.pnl < 0) {
        if (currentStreakType === 'loss') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'loss';
        }
        
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      } else {
        // Reset streak on break-even trades
        currentStreak = 0;
        currentStreakType = null;
      }
    });
    
    // Build final statistics object
    const statistics = {
      overview: {
        totalTrades,
        openTrades,
        closedTrades,
        winCount,
        lossCount,
        breakEvenCount,
        winRate,
        lossRate,
        breakEvenRate,
        totalPnl,
        avgWin,
        avgLoss,
        profitFactor,
        largestWin,
        largestLoss,
        maxWinStreak,
        maxLossStreak,
        currentStreak: {
          count: currentStreak,
          type: currentStreakType,
        },
      },
      symbols: symbolStatsArray,
      strategies: strategyStatsArray,
      timeDistribution,
    };

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Server error calculating statistics' },
      { status: 500 }
    );
  }
} 