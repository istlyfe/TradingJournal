import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";

// Specify Node.js runtime
export const runtime = 'nodejs';


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
    const format = searchParams.get("format");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Check if watchlist exists and belongs to user
    const watchlist = await db
      .prepare("SELECT * FROM watchlists WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found or unauthorized" }, { status: 404 });
    }

    // Get watchlist items
    const items = await db
      .prepare("SELECT * FROM watchlist_items WHERE watchlist_id = ? ORDER BY created_at DESC")
      .bind(id)
      .all();
    
    const result = {
      ...watchlist,
      items: items.results
    };
    
    // If format is JSON, return as downloadable file
    if (format === "json") {
      const fileName = `watchlist-${watchlist.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      return new NextResponse(JSON.stringify(result, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
    
    // Check if watchlist exists and belongs to user
    const existingWatchlist = await db
      .prepare("SELECT id FROM watchlists WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!existingWatchlist) {
      return NextResponse.json({ error: "Watchlist not found or unauthorized" }, { status: 404 });
    }

    // Update watchlist
    await db
      .prepare("UPDATE watchlists SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(name, description || null, id)
      .run();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating watchlist:", error);
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 500 });
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
    
    // Check if watchlist exists and belongs to user
    const existingWatchlist = await db
      .prepare("SELECT id FROM watchlists WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first();
    
    if (!existingWatchlist) {
      return NextResponse.json({ error: "Watchlist not found or unauthorized" }, { status: 404 });
    }

    // Delete watchlist (cascade will handle watchlist items)
    await db
      .prepare("DELETE FROM watchlists WHERE id = ?")
      .bind(id)
      .run();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting watchlist:", error);
    return NextResponse.json({ error: "Failed to delete watchlist" }, { status: 500 });
  }
}
