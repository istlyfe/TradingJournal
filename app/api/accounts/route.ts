import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all accounts for the current user
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(accessToken);

    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch all accounts for the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching accounts' },
      { status: 500 }
    );
  }
}

// POST create a new account
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(accessToken);

    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await request.json();
    const { name, broker, accountType, currency, initialBalance, currentBalance, isDefault } = data;

    // Validate input
    if (!name || !broker || !accountType || !currency || initialBalance === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this account is marked as default, unset default on other accounts
    if (isDefault) {
      await prisma.account.updateMany({
        where: {
          userId: decoded.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the account
    const newAccount = await prisma.account.create({
      data: {
        name,
        broker,
        accountType,
        currency,
        initialBalance,
        currentBalance: currentBalance || initialBalance,
        isDefault: isDefault || false,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account: newAccount,
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, message: 'Server error creating account' },
      { status: 500 }
    );
  }
} 