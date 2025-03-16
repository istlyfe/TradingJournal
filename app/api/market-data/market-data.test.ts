import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the ApiClient
vi.mock('@/lib/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getStockChart: vi.fn().mockResolvedValue({
          chart: {
            result: [{
              meta: { symbol: 'AAPL' },
              timestamp: [1615184400, 1615270800],
              indicators: {
                quote: [{
                  close: [120.5, 121.2],
                  open: [119.8, 120.4],
                  high: [121.0, 122.0],
                  low: [119.5, 120.0],
                  volume: [80000000, 90000000]
                }]
              }
            }]
          }
        }),
        getStockInsights: vi.fn().mockResolvedValue({
          finance: {
            result: {
              symbol: 'AAPL'
            }
          }
        }),
        getStockHolders: vi.fn().mockResolvedValue({
          quoteSummary: {
            result: [{
              insiderHolders: {
                holders: []
              }
            }]
          }
        })
      };
    })
  };
});

// Import after mocking
import { GET as getChartData } from '@/app/api/market-data/chart/route';
import { GET as getInsightsData } from '@/app/api/market-data/insights/route';
import { GET as getHoldersData } from '@/app/api/market-data/holders/route';

describe('Market Data API Routes', () => {
  describe('Chart Route', () => {
    it('should return chart data for a valid symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/chart?symbol=AAPL');
      const response = await getChartData(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.chart).toBeDefined();
      expect(data.chart.result[0].meta.symbol).toBe('AAPL');
    });
    
    it('should return 400 if symbol is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/chart');
      const response = await getChartData(request);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Insights Route', () => {
    it('should return insights data for a valid symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/insights?symbol=AAPL');
      const response = await getInsightsData(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.finance).toBeDefined();
      expect(data.finance.result.symbol).toBe('AAPL');
    });
    
    it('should return 400 if symbol is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/insights');
      const response = await getInsightsData(request);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Holders Route', () => {
    it('should return holders data for a valid symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/holders?symbol=AAPL');
      const response = await getHoldersData(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.quoteSummary).toBeDefined();
      expect(data.quoteSummary.result).toBeInstanceOf(Array);
    });
    
    it('should return 400 if symbol is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/market-data/holders');
      const response = await getHoldersData(request);
      
      expect(response.status).toBe(400);
    });
  });
});
