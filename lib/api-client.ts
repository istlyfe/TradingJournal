import axios from 'axios';

interface StockChartParams {
  symbol: string;
  region?: string;
  interval: string;
  range: string;
  includePrePost?: boolean;
  includeAdjustedClose?: boolean;
}

interface StockInsightsParams {
  symbol: string;
}

interface StockHoldersParams {
  symbol: string;
  region?: string;
  lang?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/market-data';
  }

  async getStockChart(params: StockChartParams) {
    try {
      const { symbol, interval = '1d', range = '1mo' } = params;
      
      const response = await axios.get(`${this.baseUrl}/chart`, {
        params: {
          symbol,
          interval,
          range
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching stock chart:', error);
      throw error;
    }
  }

  async getStockInsights(params: StockInsightsParams) {
    try {
      const { symbol } = params;
      
      const response = await axios.get(`${this.baseUrl}/insights`, {
        params: {
          symbol
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching stock insights:', error);
      throw error;
    }
  }

  async getStockHolders(params: StockHoldersParams) {
    try {
      const { symbol } = params;
      
      const response = await axios.get(`${this.baseUrl}/holders`, {
        params: {
          symbol
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching stock holders:', error);
      throw error;
    }
  }
}
