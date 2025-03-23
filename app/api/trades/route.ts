import { NextRequest, NextResponse } from "next/server";
import { calculatePnL } from "@/lib/tradeService";
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Comment out for static export
// export const dynamic = 'force-dynamic';

// Mock data
const mockTrades = [
  {
    id: '1',
    user_id: 'user_1',
    symbol: 'NQ',
    trade_type: 'LONG',
    entry_price: 18500,
    exit_price: 18520,
    entry_date: '2023-06-01T10:00:00Z',
    exit_date: '2023-06-01T11:00:00Z',
    quantity: 1,
    fees: 0,
    profit_loss: 400, // 20 point difference * $20 multiplier
    profit_loss_percentage: 0.11,
    status: 'CLOSED',
    strategy_id: null,
    risk_reward_ratio: null
  },
  {
    id: '2',
    user_id: 'user_1',
    symbol: 'ES',
    trade_type: 'SHORT',
    entry_price: 5200,
    exit_price: 5180,
    entry_date: '2023-06-02T10:00:00Z',
    exit_date: '2023-06-02T11:00:00Z',
    quantity: 1,
    fees: 0,
    profit_loss: 1000, // 20 point difference * $50 multiplier
    profit_loss_percentage: 0.38,
    status: 'CLOSED',
    strategy_id: null,
    risk_reward_ratio: null
  }
];

// GET all trades for the current user
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

    // Get accountId from query parameter (optional filter)
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    
    // Query trades for the user
    const trades = await prisma.trade.findMany({
      where: {
        userId: decoded.userId,
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

// POST create a new trade
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

    // Parse request body
    const data = await request.json();
    const {
      accountId,
      symbol,
      direction,
      entryPrice,
      exitPrice,
      quantity,
      entryDate,
      exitDate,
      fees,
      pnl,
      notes,
      strategy,
      emotionalState,
      tags,
    } = data;

    // Validate input
    if (!accountId || !symbol || !direction || !entryPrice || !quantity || !entryDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the account belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: decoded.userId,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Invalid account' },
        { status: 403 }
      );
    }

    // Create the trade
    const newTrade = await prisma.trade.create({
      data: {
        accountId,
        userId: decoded.userId,
        symbol,
        direction,
        entryPrice,
        exitPrice,
        quantity,
        entryDate: new Date(entryDate),
        exitDate: exitDate ? new Date(exitDate) : null,
        fees: fees || 0,
        pnl: pnl || null,
        notes: notes || '',
        strategy: strategy || '',
        emotionalState: emotionalState || '',
        tags: tags || [],
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trade created successfully',
      trade: newTrade,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { success: false, message: 'Server error creating trade' },
      { status: 500 }
    );
  }
}
