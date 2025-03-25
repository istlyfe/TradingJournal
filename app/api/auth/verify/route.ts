import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';

// Make route dynamic to handle cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        message: 'No token found'
      });
    }

    // Verify JWT token
    const decoded = verifyToken(accessToken);

    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        message: 'Invalid token'
      });
    }

    // Check if we have a valid userId before querying the database
    if (!decoded.userId) {
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        message: 'Token missing userId'
      });
    }

    try {
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
        include: {
          accounts: {
            select: {
              id: true,
              name: true,
              color: true,
              isDefault: true,
            },
          },
        },
      });
      
      if (!user) {
        return NextResponse.json({
          success: true,
          isAuthenticated: false,
          message: 'User not found'
        });
      }
      
      // Return user data (without password)
      const { password, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        success: true,
        isAuthenticated: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Database error during user lookup:', error);
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        message: 'Error looking up user'
      });
    }
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      message: 'Authentication verification failed'
    });
  }
} 