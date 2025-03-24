import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Specify Node.js runtime
export const runtime = 'nodejs';

// A debug endpoint to check if a user exists and test password comparison
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        userExists: false
      });
    }
    
    // Basic information about the user (never expose this in production)
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      passwordInfo: {
        length: user.password.length,
        prefix: user.password.substring(0, 10) + '...',
        isBcrypt: user.password.startsWith('$2')
      }
    };
    
    // If password is provided, test comparison
    let passwordMatch = false;
    if (password) {
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Error comparing passwords',
          error: error instanceof Error ? error.message : 'Unknown error',
          userExists: true,
          userInfo
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      userExists: true,
      passwordProvided: !!password,
      passwordMatch: password ? passwordMatch : undefined,
      userInfo
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 