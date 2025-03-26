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
  images?: JournalImage[]; // Images attached to the journal entry
  createdAt: string;
  updatedAt: string;
}

export interface JournalImage {
  id: string;
  url: string; // Data URL or object URL for the image
  caption?: string; // Optional caption for the image
  createdAt: string;
} 