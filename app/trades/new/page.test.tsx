import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NewTradePage from '@/app/trades/new/page';

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/trades/new'),
}));

describe('NewTradePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trade entry form', () => {
    render(<NewTradePage />);
    
    // Check for heading
    expect(screen.getByText('New Trade Entry')).toBeInTheDocument();
    
    // Check for trade type buttons
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Short')).toBeInTheDocument();
    
    // Check for form fields
    expect(screen.getByLabelText('Symbol')).toBeInTheDocument();
    expect(screen.getByLabelText('Entry Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Entry Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Fees')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop Loss')).toBeInTheDocument();
    expect(screen.getByLabelText('Take Profit')).toBeInTheDocument();
    expect(screen.getByLabelText('Risk Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Trade Notes')).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByText('Save Trade')).toBeInTheDocument();
  });

  it('toggles between Long and Short trade types', () => {
    render(<NewTradePage />);
    
    // Default should be Long
    const longButton = screen.getByText('Long');
    const shortButton = screen.getByText('Short');
    
    // Long should be active by default
    expect(longButton.className).toContain('bg-green-500');
    expect(shortButton.className).not.toContain('bg-red-500');
    
    // Click Short button
    fireEvent.click(shortButton);
    
    // Short should now be active
    expect(longButton.className).not.toContain('bg-green-500');
    expect(shortButton.className).toContain('bg-red-500');
    
    // Click Long button again
    fireEvent.click(longButton);
    
    // Long should be active again
    expect(longButton.className).toContain('bg-green-500');
    expect(shortButton.className).not.toContain('bg-red-500');
  });
});
