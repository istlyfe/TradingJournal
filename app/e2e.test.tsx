import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for API requests
const server = setupServer(
  // Mock trades endpoint
  rest.get('http://localhost:3000/api/trades', (req, res, ctx) => {
    return res(ctx.json({
      trades: [
        { id: 1, symbol: 'AAPL', trade_type: 'LONG', entry_price: 150.0, status: 'CLOSED' },
        { id: 2, symbol: 'MSFT', trade_type: 'SHORT', entry_price: 300.0, status: 'OPEN' }
      ],
      pagination: { total: 2, page: 1, limit: 20, totalPages: 1 }
    }));
  }),
  
  // Mock market data endpoint
  rest.get('http://localhost:3000/api/market-data/chart', (req, res, ctx) => {
    return res(ctx.json({
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
    }));
  })
);

// Start server before all tests
beforeAll(() => server.listen());
// Reset handlers after each test
afterEach(() => server.resetHandlers());
// Close server after all tests
afterAll(() => server.close());

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}));

describe('End-to-End Tests', () => {
  it('should load the dashboard and display trade data', async () => {
    // Render the dashboard
    render(<Dashboard />);
    
    // Check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check for dashboard elements
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('Net P&L')).toBeInTheDocument();
    
    // Check for recent trades table
    expect(screen.getByText('Recent Trades')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });
  
  it('should navigate between pages', async () => {
    // Render the app
    render(<App />);
    
    // Check that we're on the dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click on Trades link
    fireEvent.click(screen.getByText('Trades'));
    
    // Check that we navigated to trades page
    await waitFor(() => {
      expect(screen.getByText('Trade History')).toBeInTheDocument();
    });
    
    // Click on New Trade link
    fireEvent.click(screen.getByText('New Trade'));
    
    // Check that we navigated to new trade page
    await waitFor(() => {
      expect(screen.getByText('New Trade Entry')).toBeInTheDocument();
    });
    
    // Click on Analytics link
    fireEvent.click(screen.getByText('Analytics'));
    
    // Check that we navigated to analytics page
    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    });
  });
  
  it('should create a new trade', async () => {
    // Mock the POST endpoint for creating trades
    server.use(
      rest.post('http://localhost:3000/api/trades', (req, res, ctx) => {
        return res(ctx.json({ success: true, id: 3 }));
      })
    );
    
    // Render the new trade page
    render(<NewTradePage />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'NVDA' } });
    fireEvent.change(screen.getByLabelText('Entry Price'), { target: { value: '750.50' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Trade'));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Trade saved successfully!')).toBeInTheDocument();
    });
  });
});
