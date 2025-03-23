import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as Papa from 'papaparse';

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

    // Parse the request as FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'No account selected' },
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

    // Read the file content
    const csvText = await file.text();
    
    // Parse CSV
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    
    if (result.errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error parsing CSV file', 
          errors: result.errors 
        },
        { status: 400 }
      );
    }

    const data = result.data as any[];
    
    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Validate and transform the CSV data
    const processedData = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of header row and 0-indexing
      
      try {
        // Extract fields with flexible column names
        const symbol = row.symbol || row.Symbol || row.SYMBOL || row.ticker || row.Ticker || '';
        const direction = (row.direction || row.Direction || row.DIRECTION || row.type || row.Type || '').toUpperCase();
        const entryPrice = parseFloat(row.entryPrice || row.EntryPrice || row['Entry Price'] || row.entry || '0');
        const exitPrice = parseFloat(row.exitPrice || row.ExitPrice || row['Exit Price'] || row.exit || '0');
        const quantity = parseFloat(row.quantity || row.Quantity || row.QUANTITY || row.size || row.Size || '0');
        const entryDateStr = row.entryDate || row.EntryDate || row['Entry Date'] || row.entry_date || '';
        const exitDateStr = row.exitDate || row.ExitDate || row['Exit Date'] || row.exit_date || '';
        const fees = parseFloat(row.fees || row.Fees || row.FEES || row.commission || row.Commission || '0');
        const notes = row.notes || row.Notes || row.NOTES || row.comment || row.Comment || '';
        const strategy = row.strategy || row.Strategy || row.STRATEGY || '';
        const tags = row.tags || row.Tags || row.TAGS || '';
        
        // Validate required fields
        if (!symbol) {
          throw new Error('Symbol is required');
        }
        
        if (!direction || !['LONG', 'SHORT'].includes(direction)) {
          throw new Error('Direction must be either LONG or SHORT');
        }
        
        if (isNaN(entryPrice) || entryPrice <= 0) {
          throw new Error('Entry price must be a positive number');
        }
        
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error('Quantity must be a positive number');
        }
        
        if (!entryDateStr) {
          throw new Error('Entry date is required');
        }
        
        // Parse dates
        let entryDate;
        let exitDate = null;
        
        try {
          entryDate = new Date(entryDateStr);
          if (isNaN(entryDate.getTime())) {
            throw new Error('Invalid entry date format');
          }
        } catch (error) {
          throw new Error('Invalid entry date format');
        }
        
        if (exitDateStr) {
          try {
            exitDate = new Date(exitDateStr);
            if (isNaN(exitDate.getTime())) {
              throw new Error('Invalid exit date format');
            }
          } catch (error) {
            throw new Error('Invalid exit date format');
          }
        }
        
        // Calculate P&L if exit price is provided
        let pnl = 0;
        if (!isNaN(exitPrice) && exitPrice > 0 && exitDate) {
          // Calculate P&L based on direction
          if (direction === 'LONG') {
            pnl = (exitPrice - entryPrice) * quantity - fees;
          } else {
            pnl = (entryPrice - exitPrice) * quantity - fees;
          }
        }
        
        // Parse tags into array
        const tagsArray = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        
        // Create the trade object
        const trade = {
          symbol,
          direction,
          entryPrice,
          exitPrice: !isNaN(exitPrice) && exitPrice > 0 ? exitPrice : null,
          quantity,
          entryDate,
          exitDate,
          fees: !isNaN(fees) ? fees : 0,
          pnl: exitDate ? pnl : null,
          notes,
          strategy,
          tags: tagsArray,
          accountId,
          userId: decoded.userId,
        };
        
        processedData.push(trade);
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          message: error.message || 'Unknown error',
        });
      }
    }
    
    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation errors in CSV data',
          errors,
        },
        { status: 400 }
      );
    }
    
    // Save the trades to the database
    const createdTrades = await prisma.trade.createMany({
      data: processedData,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdTrades.count} trades from CSV`,
      count: createdTrades.count,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { success: false, message: 'Server error importing CSV data' },
      { status: 500 }
    );
  }
} 