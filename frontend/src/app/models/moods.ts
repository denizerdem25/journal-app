export interface Mood {
  value: string;  // backend'e giden değer: "happy"
  label: string;  // ekranda görünen: "Mutlu"
  emoji: string;  // ekranda görünen: "😊"
}

export const MOODS: Mood[] = [
  { value: 'happy', label: 'Mutlu', emoji: '😊' },
  { value: 'calm', label: 'Sakin', emoji: '😌' },
  { value: 'sad', label: 'Üzgün', emoji: '😢' },
  { value: 'angry', label: 'Sinirli', emoji: '😠' },
  { value: 'tired', label: 'Yorgun', emoji: '😴' },
];

export function moodEmoji(value: string): string {
  return MOODS.find((m) => m.value === value)?.emoji ?? '📝';
}

export function moodLabel(value: string): string {
  return MOODS.find((m) => m.value === value)?.label ?? '';
}