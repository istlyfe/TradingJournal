import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Specify Node.js runtime
export const runtime = 'nodejs';

// Health check endpoint
export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: { status: 'unknown' as 'ok' | 'error' | 'unknown', message: '', responseTime: 0 },
    environment: { 
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set'
    }
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    // Try a simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1 as result`;
    const dbEndTime = Date.now();
    checks.database.status = 'ok';
    checks.database.message = 'Connected to database';
    checks.database.responseTime = dbEndTime - dbStartTime;
  } catch (error) {
    checks.database.status = 'error';
    checks.database.message = error instanceof Error ? error.message : 'Unknown database error';
  }

  const endTime = Date.now();
  const totalResponseTime = endTime - startTime;

  return NextResponse.json({
    status: checks.database.status === 'ok' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: totalResponseTime,
    checks
  });
} 