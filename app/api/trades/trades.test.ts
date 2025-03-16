import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { D1Database } from '@cloudflare/workers-types';

// Mock the D1 database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
};

// Mock the environment
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn().mockImplementation((data, options) => {
        return {
          status: options?.status || 200,
          json: async () => data
        };
      })
    }
  };
});

// Set the DB in the environment
vi.stubGlobal('process', {
  ...process,
  env: {
    ...process.env,
    DB: mockDb
  }
});

// Import after mocking
import { GET as getTrades, POST as createTrade } from '@/app/api/trades/route';
import { NextRequest } from 'next/server';

describe('Trades API Routes', () => {
  beforeAll(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('GET /api/trades', () => {
    it('should return trades for a valid user', async () => {
      // Mock the database response
      mockDb.all.mockResolvedValueOnce({ results: [
        { id: 1, symbol: 'AAPL', trade_type: 'LONG', entry_price: 150.0 },
        { id: 2, symbol: 'MSFT', trade_type: 'SHORT', entry_price: 300.0 }
      ]});
      mockDb.first.mockResolvedValueOnce({ total: 2 });
      
      const request = new NextRequest('http://localhost:3000/api/trades?userId=1');
      const response = await getTrades(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.trades).toHaveLength(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(2);
      
      // Verify the query was built correctly
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM trades WHERE user_id = ?'));
      expect(mockDb.bind).toHaveBeenCalledWith('1', expect.anything(), expect.anything());
    });
    
    it('should return 400 if userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/trades');
      const response = await getTrades(request);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /api/trades', () => {
    it('should create a trade with valid data', async () => {
      const tradeData = {
        userId: 1,
        symbol: 'AAPL',
        tradeType: 'LONG',
        entryPrice: 150.0,
        entryDate: '2025-03-14T10:00:00Z',
        quantity: 100,
        status: 'OPEN'
      };
      
      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        body: JSON.stringify(tradeData)
      });
      
      const response = await createTrade(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe(1);
      
      // Verify the insert query was called correctly
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO trades'));
      expect(mockDb.bind).toHaveBeenCalledWith(
        1, 'AAPL', 'LONG', 150.0, expect.anything(), '2025-03-14T10:00:00Z', 
        expect.anything(), 100, expect.anything(), expect.anything(), 
        expect.anything(), 'OPEN', expect.anything(), expect.anything(),
        expect.anything(), expect.anything(), expect.anything()
      );
    });
    
    it('should return 400 if required fields are missing', async () => {
      const tradeData = {
        userId: 1,
        // Missing required fields
      };
      
      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        body: JSON.stringify(tradeData)
      });
      
      const response = await createTrade(request);
      
      expect(response.status).toBe(400);
    });
  });
});
