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

    // Mock user data for development
    const user = {
      id: userId,
      username: "demo_user",
      email: "demo@example.com",
      first_name: "Demo",
      last_name: "User",
      created_at: new Date().toISOString()
    };
    
    // Mock settings
    const settings = {
      theme: "light",
      notifications_enabled: true,
      default_account: "main"
    };
    
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
    
    // Mock user creation - in production this would use a real database
    const userId = `user_${Date.now()}`;
    
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
    
    // Mock user authentication - in production this would verify against a database
    const userId = `user_${Date.now()}`;
    
    // Generate JWT token - simplified for demo
    const token = `token_${userId}_${Date.now()}`;
    
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: userId,
        username: username,
        email: `${username}@example.com`,
        firstName: "Demo",
        lastName: "User"
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
} 