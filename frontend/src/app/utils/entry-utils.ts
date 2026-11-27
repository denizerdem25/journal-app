import { JournalEntry, MediaFileType } from '../models/journal-entry.model';

/** Konumu kesinlikle dolu olan günlük tipi */
export type LocatedEntry = JournalEntry & { latitude: number; longitude: number };

/** Günlüğün konumu var mı? (type guard) */
export function hasLocation(entry: JournalEntry): entry is LocatedEntry {
  return entry.latitude !== null && entry.longitude !== null;
}

/** Belirli türdeki medya sayısı */
export function countMedia(entry: JournalEntry, type: MediaFileType): number {
  return entry.media.filter((m) => m.type === type).length;
}

/** Günlüğün ilk fotoğrafının id'si; fotoğraf yoksa null */
export function firstPhotoId(entry: JournalEntry): number | null {
  return entry.media.find((m) => m.type === 'PHOTO')?.id ?? null;
}

/** "📷 2 · 🎤 1 · 🎬 1" gibi kısa medya özeti; medya yoksa boş metin */
export function mediaSummary(entry: JournalEntry): string {
  const icons: Record<MediaFileType, string> = { PHOTO: '📷', AUDIO: '🎤', VIDEO: '🎬' };

  return (Object.keys(icons) as MediaFileType[])
    .map((type) => {
      const count = countMedia(entry, type);
      return count > 0 ? `${icons[type]} ${count}` : '';
    })
    .filter((part) => part !== '')
    .join(' · ');
}