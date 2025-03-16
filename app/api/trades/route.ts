import { NextRequest, NextResponse } from "next/server";
import { calculatePnL } from "@/lib/tradeService";

// Comment out for static export
// export const dynamic = 'force-dynamic';

// Mock data
const mockTrades = [
  {
    id: '1',
    user_id: 'user_1',
    symbol: 'NQ',
    trade_type: 'LONG',
    entry_price: 18500,
    exit_price: 18520,
    entry_date: '2023-06-01T10:00:00Z',
    exit_date: '2023-06-01T11:00:00Z',
    quantity: 1,
    fees: 0,
    profit_loss: 400, // 20 point difference * $20 multiplier
    profit_loss_percentage: 0.11,
    status: 'CLOSED',
    strategy_id: null,
    risk_reward_ratio: null
  },
  {
    id: '2',
    user_id: 'user_1',
    symbol: 'ES',
    trade_type: 'SHORT',
    entry_price: 5200,
    exit_price: 5180,
    entry_date: '2023-06-02T10:00:00Z',
    exit_date: '2023-06-02T11:00:00Z',
    quantity: 1,
    fees: 0,
    profit_loss: 1000, // 20 point difference * $50 multiplier
    profit_loss_percentage: 0.38,
    status: 'CLOSED',
    strategy_id: null,
    risk_reward_ratio: null
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const symbol = searchParams.get("symbol");
    const tradeType = searchParams.get("tradeType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Filter mock trades
    let filteredTrades = mockTrades.filter(trade => trade.user_id === userId);
    
    if (status) {
      filteredTrades = filteredTrades.filter(trade => trade.status === status);
    }
    
    if (symbol) {
      filteredTrades = filteredTrades.filter(trade => trade.symbol.includes(symbol));
    }
    
    if (tradeType) {
      filteredTrades = filteredTrades.filter(trade => trade.trade_type === tradeType);
    }
    
    if (startDate) {
      filteredTrades = filteredTrades.filter(trade => new Date(trade.entry_date) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredTrades = filteredTrades.filter(trade => new Date(trade.entry_date) <= new Date(endDate));
    }
    
    // Paginate results
    const paginatedTrades = filteredTrades.slice(offset, offset + limit);
    
    return NextResponse.json({
      trades: paginatedTrades,
      pagination: {
        total: filteredTrades.length,
        page,
        limit,
        totalPages: Math.ceil(filteredTrades.length / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      symbol, 
      tradeType, 
      entryPrice, 
      exitPrice, 
      entryDate, 
      exitDate, 
      quantity, 
      fees, 
      profitLoss, 
      profitLossPercentage,
      status,
      strategyId,
      riskRewardRatio,
      riskAmount,
      stopLoss,
      takeProfit,
      notes,
      tags
    } = body;

    if (!userId || !symbol || !tradeType || !entryPrice || !entryDate || !quantity || !status) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: "userId, symbol, tradeType, entryPrice, entryDate, quantity, status" 
      }, { status: 400 });
    }

    // Calculate actual P&L using our trade service
    let actualPnL = profitLoss;
    if (exitPrice && status === 'CLOSED') {
      actualPnL = calculatePnL(
        symbol,
        tradeType as any,
        parseFloat(entryPrice),
        parseFloat(exitPrice),
        parseFloat(quantity)
      );
    }
    
    // Create a new trade
    const tradeId = `trade_${Date.now()}`;
    const newTrade = {
      id: tradeId,
      user_id: userId,
      symbol,
      trade_type: tradeType,
      entry_price: entryPrice,
      exit_price: exitPrice,
      entry_date: entryDate,
      exit_date: exitDate,
      quantity,
      fees: fees || 0,
      profit_loss: actualPnL,
      profit_loss_percentage: profitLossPercentage,
      status,
      strategy_id: strategyId,
      risk_reward_ratio: riskRewardRatio,
      risk_amount: riskAmount,
      stop_loss: stopLoss,
      take_profit: takeProfit
    };
    
    // Add to mock data
    mockTrades.push(newTrade as any);
    
    return NextResponse.json({ 
      success: true, 
      tradeId,
      trade: newTrade
    });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
