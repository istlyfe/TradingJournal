import { NextRequest, NextResponse } from "next/server";
import { calculatePnL } from "@/lib/tradeService";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Specify Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET all trades for the current user
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

    // Get accountId from query parameter (optional filter)
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    
    // Query trades for the user
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        ...(accountId ? { accountId } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json({
      success: true,
      trades,
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching trades' },
      { status: 500 }
    );
  }
}

// POST new trade
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
    const { symbol, tradeType, entryPrice, quantity, accountId } = body;
    
    if (!symbol || !tradeType || !entryPrice || !quantity || !accountId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id
      }
    });

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Invalid account' },
        { status: 400 }
      );
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        accountId,
        symbol,
        tradeType,
        entryPrice: parseFloat(entryPrice),
        quantity: parseInt(quantity),
        entryDate: new Date(),
        status: 'OPEN',
        ...body
      },
      include: {
        account: true
      }
    });

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { success: false, message: 'Server error creating trade' },
      { status: 500 }
    );
  }
}
