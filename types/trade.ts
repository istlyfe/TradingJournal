export interface Trade {
  id: string;
  accountId?: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  entryDate: string;
  exitPrice?: number;
  exitDate?: string;
  pnl?: number;
  fees?: number;
  strategy?: string;
  emotionalState?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  importSource?: string;
  contractMultiplier?: number;
} 