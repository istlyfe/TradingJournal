import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateTokens, storeRefreshToken } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';

// User registration
export async function POST(request: Request) {
  console.log('Registration endpoint called');
  
  try {
    const body = await request.json();
    console.log('Request body received:', JSON.stringify({ ...body, password: '[REDACTED]' }));
    
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Checking if email exists:', email);
    // Check if email already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log('Email already registered:', email);
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('Error checking for existing email:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error checking email', error: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('Hashing password');
    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json(
        { success: false, message: 'Error hashing password', error: hashError instanceof Error ? hashError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('Creating new user');
    // Create the user
    let newUser;
    try {
      newUser = await prisma.user.create({
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
    } catch (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { success: false, message: 'Error creating user', error: createError instanceof Error ? createError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('Generating tokens');
    // Generate tokens
    let tokens;
    try {
      tokens = generateTokens(newUser);
    } catch (tokenError) {
      console.error('Error generating tokens:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Error generating authentication tokens', error: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    console.log('Storing refresh token');
    // Store refresh token
    try {
      await storeRefreshToken(newUser.id, tokens.refreshToken, tokens.expiresAt);
    } catch (storeError) {
      console.error('Error storing refresh token:', storeError);
      return NextResponse.json(
        { success: false, message: 'Error storing refresh token', error: storeError instanceof Error ? storeError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    console.log('Creating response with cookies');
    // Create the response
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    }, { status: 201 });

    // Set cookies
    try {
      response.cookies.set('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 15, // 15 minutes
        path: '/'
      });

      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    } catch (cookieError) {
      console.error('Error setting cookies:', cookieError);
      // We'll still return a success response but log the cookie error
    }

    console.log('Registration successful');
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error during registration',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 