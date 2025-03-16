import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '@/lib/api-client';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    apiClient = new ApiClient();
  });

  describe('getStockChart', () => {
    it('should fetch stock chart data', async () => {
      const result = await apiClient.getStockChart({
        symbol: 'AAPL',
        interval: '1d',
        range: '1mo'
      });
      
      expect(result).toBeDefined();
      expect(result.chart).toBeDefined();
      expect(result.chart.result).toBeInstanceOf(Array);
      
      if (result.chart.result.length > 0) {
        const chartData = result.chart.result[0];
        expect(chartData.meta).toBeDefined();
        expect(chartData.meta.symbol).toBe('AAPL');
        expect(chartData.timestamp).toBeInstanceOf(Array);
        expect(chartData.indicators).toBeDefined();
      }
    }, 10000);
  });

  describe('getStockInsights', () => {
    it('should fetch stock insights data', async () => {
      const result = await apiClient.getStockInsights({
        symbol: 'AAPL'
      });
      
      expect(result).toBeDefined();
      expect(result.finance).toBeDefined();
      expect(result.finance.result).toBeDefined();
      expect(result.finance.result.symbol).toBe('AAPL');
    }, 10000);
  });

  describe('getStockHolders', () => {
    it('should fetch stock holders data', async () => {
      const result = await apiClient.getStockHolders({
        symbol: 'AAPL'
      });
      
      expect(result).toBeDefined();
      expect(result.quoteSummary).toBeDefined();
      expect(result.quoteSummary.result).toBeInstanceOf(Array);
      
      if (result.quoteSummary.result.length > 0) {
        const holdersData = result.quoteSummary.result[0];
        expect(holdersData.insiderHolders).toBeDefined();
      }
    }, 10000);
  });
});
