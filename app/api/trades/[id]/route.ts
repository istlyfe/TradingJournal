import { NextRequest, NextResponse } from "next/server";
import { calculatePnL } from "@/lib/tradeService";
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';


// Comment out for static export
// export const dynamic = 'force-dynamic';

// Mock data - same as in the main trades route
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
    risk_reward_ratio: null,
    notes: 'Good trade following the trend',
    tags: ['trend', 'morning']
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
    risk_reward_ratio: null,
    notes: 'Reversal at resistance',
    tags: ['reversal', 'resistance']
  }
];

// GET a specific trade by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = params.id;

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

    // Fetch the trade
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId,
      },
      include: {
        account: true,
      },
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    // Verify the trade belongs to the user
    if (trade.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to trade' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching trade' },
      { status: 500 }
    );
  }
}

// PATCH update a trade
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = params.id;

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

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findUnique({
      where: {
        id: tradeId,
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    if (existingTrade.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to trade' },
        { status: 403 }
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

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (accountId !== undefined) {
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

      updateData.accountId = accountId;
    }

    if (symbol !== undefined) updateData.symbol = symbol;
    if (direction !== undefined) updateData.direction = direction;
    if (entryPrice !== undefined) updateData.entryPrice = entryPrice;
    if (exitPrice !== undefined) updateData.exitPrice = exitPrice;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
    if (exitDate !== undefined) updateData.exitDate = exitDate ? new Date(exitDate) : null;
    if (fees !== undefined) updateData.fees = fees;
    if (pnl !== undefined) updateData.pnl = pnl;
    if (notes !== undefined) updateData.notes = notes;
    if (strategy !== undefined) updateData.strategy = strategy;
    if (emotionalState !== undefined) updateData.emotionalState = emotionalState;
    if (tags !== undefined) updateData.tags = tags;

    // Update the trade
    const updatedTrade = await prisma.trade.update({
      where: {
        id: tradeId,
      },
      data: updateData,
      include: {
        account: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trade updated successfully',
      trade: updatedTrade,
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating trade' },
      { status: 500 }
    );
  }
}

// DELETE a trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = params.id;

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

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findUnique({
      where: {
        id: tradeId,
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    if (existingTrade.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to trade' },
        { status: 403 }
      );
    }

    // Delete the trade
    await prisma.trade.delete({
      where: {
        id: tradeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { success: false, message: 'Server error deleting trade' },
      { status: 500 }
    );
  }
}
