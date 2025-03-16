import { NextRequest, NextResponse } from "next/server";
import { calculatePnL } from "@/lib/tradeService";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Mock data - same as in the main trades route
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
    risk_reward_ratio: null,
    notes: 'Good trade following the trend',
    tags: ['trend', 'morning']
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
    risk_reward_ratio: null,
    notes: 'Reversal at resistance',
    tags: ['reversal', 'resistance']
  }
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tradeId = params.id;
    
    // Find the trade in mock data
    const trade = mockTrades.find(t => t.id === tradeId);
    
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    
    return NextResponse.json(trade);
  } catch (error) {
    console.error("Error fetching trade:", error);
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tradeId = params.id;
    const body = await request.json();
    const { 
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

    // Find the trade in mock data
    const tradeIndex = mockTrades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    
    // Calculate actual P&L using our trade service
    let actualPnL = profitLoss;
    if (exitPrice && status === 'CLOSED') {
      actualPnL = calculatePnL(
        symbol || mockTrades[tradeIndex].symbol,
        tradeType || mockTrades[tradeIndex].trade_type as any,
        parseFloat(entryPrice || mockTrades[tradeIndex].entry_price as any),
        parseFloat(exitPrice),
        parseFloat(quantity || mockTrades[tradeIndex].quantity as any)
      );
    }
    
    // Update the trade
    const updatedTrade = {
      ...mockTrades[tradeIndex],
      symbol: symbol || mockTrades[tradeIndex].symbol,
      trade_type: tradeType || mockTrades[tradeIndex].trade_type,
      entry_price: entryPrice || mockTrades[tradeIndex].entry_price,
      exit_price: exitPrice,
      entry_date: entryDate || mockTrades[tradeIndex].entry_date,
      exit_date: exitDate,
      quantity: quantity || mockTrades[tradeIndex].quantity,
      fees: fees !== undefined ? fees : mockTrades[tradeIndex].fees,
      profit_loss: actualPnL,
      profit_loss_percentage: profitLossPercentage,
      status: status || mockTrades[tradeIndex].status,
      strategy_id: strategyId,
      risk_reward_ratio: riskRewardRatio,
      risk_amount: riskAmount,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      notes: notes,
      tags: tags
    };
    
    // Update in mock data
    mockTrades[tradeIndex] = updatedTrade as any;
    
    return NextResponse.json({ 
      success: true, 
      trade: updatedTrade
    });
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tradeId = params.id;
    
    // Find the trade in mock data
    const tradeIndex = mockTrades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    
    // Remove from mock data
    mockTrades.splice(tradeIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 });
  }
}
