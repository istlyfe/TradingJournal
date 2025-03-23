import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
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

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Special case for demo user
    if (email === 'demo@example.com') {
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
      
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword
      });
    }

    // For normal users, verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    );
  }
} 