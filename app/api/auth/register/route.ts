import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateTokens, storeRefreshToken } from '@/lib/auth';

// User registration
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Create a default account for the user
        accounts: {
          create: {
            name: 'Default Account',
            color: '#7C3AED'
          }
        },
        // Default settings
        settings: {
          theme: 'system', // light, dark, system
          notifications: {
            email: true,
            app: true
          }
        }
      },
      include: {
        accounts: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(newUser);
    
    // Store refresh token
    await storeRefreshToken(newUser.id, refreshToken, expiresAt);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Create the response
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    }, { status: 201 });

    // Set cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/'
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during registration' },
      { status: 500 }
    );
  }
} 