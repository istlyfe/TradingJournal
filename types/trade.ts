export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  entryDate: string;
  exitPrice?: number;
  exitDate?: string;
  pnl?: number;
  notes?: string;
  tags?: string[];
} 