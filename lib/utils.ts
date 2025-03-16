import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function percentChange(current: number, previous: number): string {
  if (previous === 0) return "+0%";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

// Attempt to parse a date string using multiple formats
export function parseTradeDate(dateStr: string): Date | null {
  // First try the standard JavaScript Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try some common date formats
  const formats = [
    // MM/DD/YYYY formats
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s?(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?\s?(AM|PM|am|pm)?$/,
      parse: (match: RegExpMatchArray) => {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        let hours = parseInt(match[4] || "0");
        const minutes = parseInt(match[5] || "0");
        const seconds = parseInt(match[6] || "0");
        const ampm = match[7]?.toUpperCase();
        
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        
        return new Date(year, month, day, hours, minutes, seconds);
      }
    },
    // YYYY-MM-DD formats
    {
      regex: /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):?(\d{1,2})?:?(\d{1,2})?)?$/,
      parse: (match: RegExpMatchArray) => {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        const hours = parseInt(match[4] || "0");
        const minutes = parseInt(match[5] || "0");
        const seconds = parseInt(match[6] || "0");
        
        return new Date(year, month, day, hours, minutes, seconds);
      }
    }
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format.regex);
    if (match) {
      const parsedDate = format.parse(match);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  return null;
}

// Get the multiplier for futures contracts
export function getFuturesContractMultiplier(symbol: string): number {
  // Common futures contract multipliers
  const multipliers: Record<string, number> = {
    'ES': 50,  // E-mini S&P 500
    'NQ': 20,  // E-mini Nasdaq-100
    'YM': 5,   // E-mini Dow
    'RTY': 10, // E-mini Russell 2000
    'CL': 1000, // Crude Oil
    'GC': 100,  // Gold
    'SI': 5000, // Silver
    'ZB': 1000, // 30-Year T-Bond
    'ZN': 1000, // 10-Year T-Note
    '6E': 125000, // Euro FX
  };

  // Extract the base symbol (e.g., 'NQH4' -> 'NQ')
  const baseSymbol = symbol.replace(/[0-9]/g, '').replace(/[A-Z]$/, '');
  
  return multipliers[baseSymbol] || 1;
}

// Determine if a symbol is a futures contract
export function isFuturesContract(symbol: string): boolean {
  // Common futures symbols often end with month/year codes or have typical prefixes
  const futuresPattern = /^(ES|NQ|YM|RTY|CL|GC|SI|ZN|ZF|ZT|NG|RB|HO|M[ES]|M[NQ]|M[YM]|M[2K]|MGC)/;
  return futuresPattern.test(symbol.trim());
}
