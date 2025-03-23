import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Demo login request received');
    
    // Create or find demo user
    let demoUser = await prisma.user.findFirst({
      where: {
        email: 'demo@example.com',
      },
      include: {
        accounts: true,
      },
    });

    console.log('Demo user search result:', demoUser ? 'User found' : 'User not found');
    
    // If demo user doesn't exist, create one
    if (!demoUser) {
      console.log('Creating new demo user');
      try {
        demoUser = await prisma.user.create({
          data: {
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'hashed_demo_password', // In a real app, you'd hash this
            accounts: {
              create: [
                {
                  name: 'Demo Trading Account',
                  broker: 'Demo Broker',
                  accountType: 'DEMO',
                  currency: 'USD',
                  initialBalance: 10000,
                  currentBalance: 10850,
                  isDefault: true,
                },
                {
                  name: 'Demo Crypto Account',
                  broker: 'Coinbase',
                  accountType: 'CRYPTO',
                  currency: 'USD',
                  initialBalance: 5000,
                  currentBalance: 4750,
                  isDefault: false,
                }
              ]
            }
          },
          include: {
            accounts: true,
          },
        });
        console.log('Demo user created successfully');
      } catch (createError) {
        console.error('Error creating demo user:', createError);
        throw createError;
      }

      // Add some demo trades
      const demoAccount = demoUser.accounts[0];
      
      await prisma.trade.createMany({
        data: [
          {
            symbol: 'AAPL',
            direction: 'LONG',
            entryPrice: 175.50,
            exitPrice: 182.75,
            quantity: 10,
            entryDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
            exitDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
            fees: 9.99,
            pnl: 72.51,
            notes: 'Strong earnings report, good market sentiment',
            strategy: 'Swing Trading',
            tags: ['tech', 'earnings'],
            emotionalState: 'Confident',
            userId: demoUser.id,
            accountId: demoAccount.id,
          },
          {
            symbol: 'MSFT',
            direction: 'LONG',
            entryPrice: 320.25,
            exitPrice: 335.50,
            quantity: 5,
            entryDate: new Date(Date.now() - 86400000 * 6), // 6 days ago
            exitDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
            fees: 9.99,
            pnl: 76.26,
            notes: 'Cloud services growth exceeding expectations',
            strategy: 'Momentum',
            tags: ['tech', 'cloud'],
            emotionalState: 'Focused',
            userId: demoUser.id,
            accountId: demoAccount.id,
          },
          {
            symbol: 'TSLA',
            direction: 'SHORT',
            entryPrice: 245.75,
            exitPrice: 230.50,
            quantity: 8,
            entryDate: new Date(Date.now() - 86400000 * 4), // 4 days ago
            exitDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
            fees: 9.99,
            pnl: 122.01,
            notes: 'Bearish technical pattern, overbought conditions',
            strategy: 'Technical Analysis',
            tags: ['tech', 'ev'],
            emotionalState: 'Cautious',
            userId: demoUser.id,
            accountId: demoAccount.id,
          },
          {
            symbol: 'AMZN',
            direction: 'LONG',
            entryPrice: 140.25,
            quantity: 12,
            entryDate: new Date(), // Today (open position)
            fees: 9.99,
            notes: 'Positive retail outlook, AWS growth',
            strategy: 'Swing Trading',
            tags: ['tech', 'retail'],
            emotionalState: 'Optimistic',
            userId: demoUser.id,
            accountId: demoAccount.id,
          },
          {
            symbol: 'NVDA',
            direction: 'LONG',
            entryPrice: 840.50,
            exitPrice: 820.25,
            quantity: 3,
            entryDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
            exitDate: new Date(Date.now() - 86400000), // 1 day ago
            fees: 9.99,
            pnl: -60.74,
            notes: 'AI chip demand strong but entry timing was off',
            strategy: 'Momentum',
            tags: ['tech', 'ai', 'chips'],
            emotionalState: 'Rushed',
            userId: demoUser.id,
            accountId: demoAccount.id,
          }
        ]
      });
    }

    // Generate JWT token
    console.log('Generating JWT token for demo user');
    const accessToken = sign(
      { 
        userId: demoUser.id,
        email: demoUser.email,
        name: demoUser.name
      },
      process.env.JWT_SECRET || 'demo_secret_key',
      { expiresIn: '8h' }
    );
    console.log('JWT token generated successfully');

    // Set cookies
    console.log('Setting access token cookie');
    try {
      cookies().set({
        name: 'accessToken',
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });
      console.log('Cookie set successfully');
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      throw cookieError;
    }

    // Return user data (without password)
    const { password, ...userWithoutPassword } = demoUser;
    console.log('Returning successful demo login response');

    return NextResponse.json({
      success: true,
      message: 'Demo login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create demo login', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 