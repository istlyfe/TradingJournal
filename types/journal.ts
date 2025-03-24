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
  mood?: string; // Trading mood when entry was written
  template?: string; // Template used for the entry
  createdAt: string;
  updatedAt: string;
} 