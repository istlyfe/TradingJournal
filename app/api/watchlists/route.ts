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
    const format = searchParams.get("format");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Get all watchlists for the user
    const watchlists = await db
      .prepare("SELECT * FROM watchlists WHERE user_id = ? ORDER BY created_at DESC")
      .bind(userId)
      .all();
    
    // For each watchlist, get the items
    const result = [];
    for (const watchlist of watchlists.results) {
      const items = await db
        .prepare("SELECT * FROM watchlist_items WHERE watchlist_id = ? ORDER BY created_at DESC")
        .bind(watchlist.id)
        .all();
      
      result.push({
        ...watchlist,
        items: items.results
      });
    }
    
    // If format is JSON, return as downloadable file
    if (format === "json") {
      const fileName = `watchlists-${new Date().toISOString().split('T')[0]}.json`;
      return new NextResponse(JSON.stringify(result, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching watchlists:", error);
    return NextResponse.json({ error: "Failed to fetch watchlists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

    if (!userId || !name) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: "userId, name" 
      }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Insert watchlist
    const result = await db
      .prepare("INSERT INTO watchlists (user_id, name, description) VALUES (?, ?, ?)")
      .bind(userId, name, description || null)
      .run();
    
    const watchlistId = result.meta.last_row_id;
    
    return NextResponse.json({ 
      success: true, 
      id: watchlistId,
      name,
      description
    });
  } catch (error) {
    console.error("Error creating watchlist:", error);
    return NextResponse.json({ error: "Failed to create watchlist" }, { status: 500 });
  }
}
