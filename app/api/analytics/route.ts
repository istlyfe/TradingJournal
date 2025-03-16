import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Build query with filters
    let query = `
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(CASE WHEN profit_loss IS NULL THEN 1 ELSE 0 END) as open_trades,
        SUM(profit_loss) as total_profit_loss,
        AVG(CASE WHEN profit_loss > 0 THEN profit_loss ELSE NULL END) as avg_win,
        AVG(CASE WHEN profit_loss < 0 THEN profit_loss ELSE NULL END) as avg_loss,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as gross_loss
      FROM trades 
      WHERE user_id = ? AND status = 'CLOSED'
    `;
    
    const params: any[] = [userId];
    
    if (startDate) {
      query += " AND entry_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND entry_date <= ?";
      params.push(endDate);
    }
    
    // Execute query
    const stats = await db
      .prepare(query)
      .bind(...params)
      .first();
    
    // Calculate derived metrics
    const totalTrades = stats?.total_trades as number || 0;
    const winningTrades = stats?.winning_trades as number || 0;
    const losingTrades = stats?.losing_trades as number || 0;
    const grossProfit = stats?.gross_profit as number || 0;
    const grossLoss = Math.abs(stats?.gross_loss as number || 0);
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Get performance by symbol
    const symbolPerformance = await db
      .prepare(`
        SELECT 
          symbol,
          COUNT(*) as total_trades,
          SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
          SUM(profit_loss) as total_profit_loss
        FROM trades 
        WHERE user_id = ? AND status = 'CLOSED'
        ${startDate ? " AND entry_date >= ?" : ""}
        ${endDate ? " AND entry_date <= ?" : ""}
        GROUP BY symbol
        ORDER BY total_profit_loss DESC
      `)
      .bind(...params)
      .all();
    
    // Get performance by strategy
    const strategyPerformance = await db
      .prepare(`
        SELECT 
          s.id,
          s.name,
          COUNT(*) as total_trades,
          SUM(CASE WHEN t.profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(CASE WHEN t.profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
          SUM(t.profit_loss) as total_profit_loss
        FROM trades t
        JOIN strategies s ON t.strategy_id = s.id
        WHERE t.user_id = ? AND t.status = 'CLOSED'
        ${startDate ? " AND t.entry_date >= ?" : ""}
        ${endDate ? " AND t.entry_date <= ?" : ""}
        GROUP BY s.id, s.name
        ORDER BY total_profit_loss DESC
      `)
      .bind(...params)
      .all();
    
    return NextResponse.json({
      overview: {
        totalTrades,
        winningTrades,
        losingTrades,
        openTrades: stats?.open_trades || 0,
        totalProfitLoss: stats?.total_profit_loss || 0,
        avgWin: stats?.avg_win || 0,
        avgLoss: stats?.avg_loss || 0,
        winRate,
        profitFactor
      },
      symbolPerformance: symbolPerformance.results,
      strategyPerformance: strategyPerformance.results
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
