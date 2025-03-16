import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Get all tags for the user
    const tags = await db
      .prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC")
      .bind(userId)
      .all();
    
    return NextResponse.json(tags.results);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, color } = body;

    if (!userId || !name) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: "userId, name" 
      }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as D1Database;
    
    // Check if tag already exists for this user
    const existingTag = await db
      .prepare("SELECT id FROM tags WHERE user_id = ? AND name = ?")
      .bind(userId, name)
      .first();
    
    if (existingTag) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    
    // Insert tag
    const result = await db
      .prepare("INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)")
      .bind(userId, name, color || "#3498db")
      .run();
    
    const tagId = result.meta.last_row_id;
    
    return NextResponse.json({ 
      success: true, 
      id: tagId,
      name,
      color: color || "#3498db"
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
