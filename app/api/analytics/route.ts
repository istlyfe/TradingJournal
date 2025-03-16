import { NextRequest, NextResponse } from "next/server";

// Add export configuration to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const accountId = searchParams.get("accountId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Generate mock analytics data
    const mockStats = {
      total_trades: 25,
      winning_trades: 15,
      losing_trades: 10,
      open_trades: 3,
      total_profit_loss: 2850,
      win_rate: 60,
      avg_win: 320,
      avg_loss: -150,
      largest_win: 1250,
      largest_loss: -450,
      profit_factor: 3.2,
      expectancy: 114,
      avg_trade: 114,
      avg_hold_time: 45,
      gross_profit: 4800,
      gross_loss: -1950
    };
    
    // Mock trade breakdown by symbol
    const mockSymbolBreakdown = [
      {
        symbol: 'NQ',
        total_trades: 12,
        winning_trades: 8,
        losing_trades: 4,
        total_profit_loss: 1800,
        win_rate: 66.7
      },
      {
        symbol: 'ES',
        total_trades: 8,
        winning_trades: 5,
        losing_trades: 3,
        total_profit_loss: 750,
        win_rate: 62.5
      },
      {
        symbol: 'AAPL',
        total_trades: 5,
        winning_trades: 2,
        losing_trades: 3,
        total_profit_loss: 300,
        win_rate: 40
      }
    ];
    
    // Mock profit by day of week
    const mockProfitByDayOfWeek = [
      { day: 'Monday', total_profit_loss: 450 },
      { day: 'Tuesday', total_profit_loss: 850 },
      { day: 'Wednesday', total_profit_loss: 600 },
      { day: 'Thursday', total_profit_loss: 400 },
      { day: 'Friday', total_profit_loss: 550 }
    ];
    
    // Mock profit by time of day
    const mockProfitByTimeOfDay = [
      { hour: 9, total_profit_loss: 350 },
      { hour: 10, total_profit_loss: 950 },
      { hour: 11, total_profit_loss: 400 },
      { hour: 12, total_profit_loss: -150 },
      { hour: 13, total_profit_loss: 550 },
      { hour: 14, total_profit_loss: 450 },
      { hour: 15, total_profit_loss: 300 }
    ];
    
    // Mock profit by strategy
    const mockProfitByStrategy = [
      { strategy: 'Trend Following', total_profit_loss: 1350 },
      { strategy: 'Breakout', total_profit_loss: 850 },
      { strategy: 'Reversal', total_profit_loss: 650 }
    ];
    
    return NextResponse.json({
      stats: mockStats,
      bySymbol: mockSymbolBreakdown,
      byDayOfWeek: mockProfitByDayOfWeek, 
      byTimeOfDay: mockProfitByTimeOfDay,
      byStrategy: mockProfitByStrategy
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
