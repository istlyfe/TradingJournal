import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Specify Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET all accounts for the current user
export async function GET(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Query accounts for the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
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

// POST new account
export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, type, currency, initialBalance } = body;
    
    if (!name || !type || !currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        currency,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
        currentBalance: initialBalance ? parseFloat(initialBalance) : 0,
        color: body.color || '#7C3AED',
        ...body
      },
    });

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, message: 'Server error creating account' },
      { status: 500 }
    );
  }
} 