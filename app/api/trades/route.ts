import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Build query with filters
    let query = "SELECT * FROM trades WHERE user_id = ?";
    const params: any[] = [userId];
    
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    
    if (symbol) {
      query += " AND symbol LIKE ?";
      params.push(`%${symbol}%`);
    }
    
    if (tradeType) {
      query += " AND trade_type = ?";
      params.push(tradeType);
    }
    
    if (startDate) {
      query += " AND entry_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND entry_date <= ?";
      params.push(endDate);
    }
    
    // Add pagination
    query += " ORDER BY entry_date DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    // Execute query
    const trades = await db
      .prepare(query)
      .bind(...params)
      .all();
    
    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM trades WHERE user_id = ?";
    const countParams: any[] = [userId];
    
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    
    if (symbol) {
      countQuery += " AND symbol LIKE ?";
      countParams.push(`%${symbol}%`);
    }
    
    if (tradeType) {
      countQuery += " AND trade_type = ?";
      countParams.push(tradeType);
    }
    
    if (startDate) {
      countQuery += " AND entry_date >= ?";
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += " AND entry_date <= ?";
      countParams.push(endDate);
    }
    
    const countResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first();
    
    const total = countResult?.total as number || 0;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      trades: trades.results,
      pagination: {
        total,
        page,
        limit,
        totalPages
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

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Insert trade
    const result = await db
      .prepare(`
        INSERT INTO trades (
          user_id, symbol, trade_type, entry_price, exit_price, 
          entry_date, exit_date, quantity, fees, profit_loss, 
          profit_loss_percentage, status, strategy_id, risk_reward_ratio, 
          risk_amount, stop_loss, take_profit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        symbol,
        tradeType,
        entryPrice,
        exitPrice,
        entryDate,
        exitDate,
        quantity,
        fees || 0,
        profitLoss,
        profitLossPercentage,
        status,
        strategyId,
        riskRewardRatio,
        riskAmount,
        stopLoss,
        takeProfit
      )
      .run();
    
    const tradeId = result.meta.last_row_id;
    
    // Add notes if provided
    if (notes && notes.length > 0) {
      await db
        .prepare("INSERT INTO trade_notes (trade_id, note) VALUES (?, ?)")
        .bind(tradeId, notes)
        .run();
    }
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await db
          .prepare("INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)")
          .bind(tradeId, tagId)
          .run();
      }
    }
    
    return NextResponse.json({ success: true, id: tradeId });
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
