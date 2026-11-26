export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryRequest {
  title: string;
  content: string;
  mood: string;
}