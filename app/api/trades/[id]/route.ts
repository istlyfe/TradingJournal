import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    const trade = await db
      .prepare("SELECT * FROM trades WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Get trade notes
    const notes = await db
      .prepare("SELECT * FROM trade_notes WHERE trade_id = ? ORDER BY created_at DESC")
      .bind(id)
      .all();

    // Get trade tags
    const tags = await db
      .prepare(`
        SELECT t.id, t.name, t.color 
        FROM tags t 
        JOIN trade_tags tt ON t.id = tt.tag_id 
        WHERE tt.trade_id = ?
      `)
      .bind(id)
      .all();

    // Get trade images
    const images = await db
      .prepare("SELECT * FROM trade_images WHERE trade_id = ?")
      .bind(id)
      .all();

    return NextResponse.json({
      trade,
      notes: notes.results,
      tags: tags.results,
      images: images.results
    });
  } catch (error) {
    console.error("Error fetching trade:", error);
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
      takeProfit
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Check if trade exists and belongs to user
    const existingTrade = await db
      .prepare("SELECT id FROM trades WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found or unauthorized" }, { status: 404 });
    }

    // Update trade
    await db
      .prepare(`
        UPDATE trades SET
          symbol = ?,
          trade_type = ?,
          entry_price = ?,
          exit_price = ?,
          entry_date = ?,
          exit_date = ?,
          quantity = ?,
          fees = ?,
          profit_loss = ?,
          profit_loss_percentage = ?,
          status = ?,
          strategy_id = ?,
          risk_reward_ratio = ?,
          risk_amount = ?,
          stop_loss = ?,
          take_profit = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `)
      .bind(
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
        id,
        userId
      )
      .run();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Check if trade exists and belongs to user
    const existingTrade = await db
      .prepare("SELECT id FROM trades WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found or unauthorized" }, { status: 404 });
    }

    // Delete trade (cascade will handle related records)
    await db
      .prepare("DELETE FROM trades WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 });
  }
}
