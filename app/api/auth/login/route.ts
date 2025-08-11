import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { comparePassword } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('Login request received');
  
  try {
    const { email, password } = await request.json();
    console.log('Attempting login for email:', email);

    // Validate inputs
    if (!email || !password) {
      console.log('Missing login credentials');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    console.log('Finding user by email');
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Check if user exists
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User found:', { id: user.id, name: user.name });

    // Special case for demo user
    if (email === 'demo@example.com') {
      console.log('Demo user login - skipping password check');
      // For demo account, we'll allow login without password verification
      // Generate JWT token
      const accessToken = sign(
        { 
          userId: user.id,
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET || 'demo_secret_key',
        { expiresIn: '8h' }
      );

      // Set cookies
      cookies().set({
        name: 'accessToken',
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('Demo login successful');
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword
      });
    }

    // For normal users, verify password
    console.log('Verifying password');
    
    // Use the comparePassword function from auth.ts for consistency
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password validation failed');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token (legacy cookie for compatibility)
    console.log('Generating token');
    const accessToken = sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'demo_secret_key',
      { expiresIn: '8h' }
    );

    // Set cookies
    console.log('Setting auth cookies');
    cookies().set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('Login successful for:', user.email);
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during login', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 