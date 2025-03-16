import { NextRequest, NextResponse } from "next/server";

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
    const db = process.env.DB as any;
    
    // Get user data
    const user = await db
      .prepare("SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = ?")
      .bind(userId)
      .first();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get user settings
    const settings = await db
      .prepare("SELECT * FROM settings WHERE user_id = ?")
      .bind(userId)
      .first();
    
    // Format user data for response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      settings: settings || {}
    };
    
    // If format is JSON, return as downloadable file
    if (format === "json") {
      const fileName = `user-data-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      return new NextResponse(JSON.stringify(userData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: "username, email, password" 
      }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as any;
    
    // Check if user already exists
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .bind(username, email)
      .first();
    
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }
    
    // Hash password - simplified for build
    const passwordHash = password; // In production, this would use bcrypt
    
    // Insert user
    const result = await db
      .prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(username, email, passwordHash, firstName || null, lastName || null)
      .run();
    
    const userId = result.meta.last_row_id;
    
    // Create default settings for user
    await db
      .prepare("INSERT INTO settings (user_id) VALUES (?)")
      .bind(userId)
      .run();
    
    // Create default watchlist
    await db
      .prepare("INSERT INTO watchlists (user_id, name, description) VALUES (?, ?, ?)")
      .bind(userId, "Default Watchlist", "Your default watchlist")
      .run();
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: userId, 
        username, 
        email,
        firstName,
        lastName
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}

// User login
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: "username, password" 
      }, { status: 400 });
    }

    // @ts-ignore - D1 is available in the environment
    const db = process.env.DB as any;
    
    // Find user
    const user = await db
      .prepare("SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE username = ?")
      .bind(username)
      .first();
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Verify password - simplified for build
    const passwordMatch = password === user.password_hash; // In production, this would use bcrypt
    
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Generate JWT token - simplified for build
    const token = `token_${user.id}_${Date.now()}`; // In production, this would use jsonwebtoken
    
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
