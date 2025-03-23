import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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
    console.error('Authentication verification error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      message: 'Authentication verification failed'
    });
  }
} 