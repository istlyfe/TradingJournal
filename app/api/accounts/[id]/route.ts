import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Specify Node.js runtime
export const runtime = 'nodejs';


// GET a specific account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;

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

    // Fetch the account
    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
      include: {
        trades: {
          orderBy: {
            entryDate: 'desc',
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    // Verify the account belongs to the user
    if (account.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to account' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching account' },
      { status: 500 }
    );
  }
}

// PATCH update an account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;

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

    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    if (existingAccount.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to account' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { name, broker, accountType, currency, initialBalance, currentBalance, isDefault } = data;

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (name !== undefined) updateData.name = name;
    if (broker !== undefined) updateData.broker = broker;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (currency !== undefined) updateData.currency = currency;
    if (initialBalance !== undefined) updateData.initialBalance = initialBalance;
    if (currentBalance !== undefined) updateData.currentBalance = currentBalance;
    
    // If this account is marked as default, unset default on other accounts
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
      
      if (isDefault) {
        await prisma.account.updateMany({
          where: {
            userId: decoded.userId,
            id: {
              not: accountId
            },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      account: updatedAccount,
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating account' },
      { status: 500 }
    );
  }
}

// DELETE an account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;

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

    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
      include: {
        trades: true
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    if (existingAccount.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to account' },
        { status: 403 }
      );
    }

    // Check if account is the default one
    if (existingAccount.isDefault) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete default account. Please set another account as default first.' 
        },
        { status: 400 }
      );
    }

    // Check if account has trades
    if (existingAccount.trades.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete account with associated trades. Please delete trades first or transfer them to another account.' 
        },
        { status: 400 }
      );
    }

    // Delete the account
    await prisma.account.delete({
      where: {
        id: accountId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, message: 'Server error deleting account' },
      { status: 500 }
    );
  }
} 