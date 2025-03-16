export function cn(...inputs: (string | boolean | undefined | {[key: string]: boolean})[]): string {
  const classes = inputs.filter(Boolean);
  
  return classes
    .flatMap(cls => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function parseTradeDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch (e) {
    console.error("Error parsing date:", e);
    return new Date();
  }
}

export function isFuturesContract(symbol: string): boolean {
  if (!symbol) return false;
  
  // Common futures markers like /ES, /NQ, etc.
  if (symbol.startsWith('/')) return true;
  
  // Common futures suffixes
  const futuresSuffixes = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
  const lastChar = symbol.slice(-1).toUpperCase();
  const secondLastChar = symbol.slice(-2, -1);
  
  // If the last character is a number and second-to-last is a futures month code
  if (!isNaN(Number(lastChar)) && futuresSuffixes.includes(secondLastChar.toUpperCase())) {
    return true;
  }
  
  return false;
}

export function getFuturesContractMultiplier(symbol: string): number {
  if (!isFuturesContract(symbol)) return 1;
  
  // Common futures contract sizes
  const contractSizes: Record<string, number> = {
    '/ES': 50,    // E-mini S&P 500
    '/NQ': 20,    // E-mini Nasdaq 100
    '/YM': 5,     // E-mini Dow
    '/RTY': 50,   // E-mini Russell 2000
    '/CL': 1000,  // Crude Oil
    '/GC': 100,   // Gold
    '/SI': 5000,  // Silver
    '/ZB': 1000,  // US Treasury Bond
    '/ZN': 1000,  // 10-Year Treasury Note
    '/ZF': 1000,  // 5-Year Treasury Note
    '/ZT': 1000,  // 2-Year Treasury Note
    '/6E': 125000 // Euro FX
  };
  
  // Extract base symbol for matching
  const baseSymbol = symbol.split(' ')[0];
  
  return contractSizes[baseSymbol] || 1;
}