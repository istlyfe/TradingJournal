import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokens, verifyRefreshToken, storeRefreshToken, invalidateRefreshToken } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const user = await verifyRefreshToken(refreshToken);

    if (!user) {
      // Token is invalid or expired
      const response = NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      
      // Clear cookies
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      
      return response;
    }

    // Invalidate the old refresh token
    await invalidateRefreshToken(refreshToken);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken, expiresAt } = generateTokens(user);
    
    // Store the new refresh token
    await storeRefreshToken(user.id, newRefreshToken, expiresAt);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully'
    });

    // Set new cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/'
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during token refresh' },
      { status: 500 }
    );
  }
} 