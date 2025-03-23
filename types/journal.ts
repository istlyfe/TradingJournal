export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  marketConditions?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  lessons?: string;
  relatedTradeIds?: string[]; // Optional related trades
  tags?: string[];
  createdAt: string;
  updatedAt: string;
} 