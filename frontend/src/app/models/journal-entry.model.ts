export type MediaFileType = 'PHOTO' | 'AUDIO' | 'VIDEO';

export interface MediaFile {
  id: number;
  type: MediaFileType;
  contentType: string;
  createdAt: string;
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
  media: MediaFile[];
}

export interface JournalEntryRequest {
  title: string;
  content: string;
  mood: string;
}