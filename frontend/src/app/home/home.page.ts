import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonIcon,
  IonRefresher, IonRefresherContent, IonNote, IonThumbnail, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';
import { JournalService } from '../services/journal.service';
import { JournalEntry, MediaFileType } from '../models/journal-entry.model';
import { moodEmoji } from '../models/moods';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonIcon,
    IonRefresher, IonRefresherContent, IonNote, IonThumbnail,
  ],
})
export class HomePage {
  private journalService = inject(JournalService);
  private navCtrl = inject(NavController);

  entries = signal<JournalEntry[]>([]);
  errorMessage = signal('');

  moodEmoji = moodEmoji;

  constructor() {
    addIcons({ add, trash });
  }

  ionViewWillEnter(): void {
    this.loadEntries();
  }

  loadEntries(event?: any): void {
    this.journalService.getAll().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.errorMessage.set('');
        event?.target.complete();
      },
      error: () => {
        this.errorMessage.set('Günlükler yüklenemedi. Backend çalışıyor mu?');
        event?.target.complete();
      },
    });
  }

  /** Günlüğün ilk fotoğrafının id'si; fotoğraf yoksa null */
  firstPhotoId(entry: JournalEntry): number | null {
    return entry.media.find((m) => m.type === 'PHOTO')?.id ?? null;
  }

  /** "📷 2 · 🎤 1 · 🎬 1" gibi kısa medya özeti; medya yoksa boş metin */
  mediaSummary(entry: JournalEntry): string {
    const icons: Record<MediaFileType, string> = { PHOTO: '📷', AUDIO: '🎤', VIDEO: '🎬' };

    return (Object.keys(icons) as MediaFileType[])
      .map((type) => {
        const count = entry.media.filter((m) => m.type === type).length;
        return count > 0 ? `${icons[type]} ${count}` : '';
      })
      .filter((part) => part !== '')
      .join(' · ');
  }

  mediaUrl(id: number): string {
    return this.journalService.mediaUrl(id);
  }

  openEntry(id: number): void {
    this.navCtrl.navigateForward(['/entry', id]);
  }

  newEntry(): void {
    this.navCtrl.navigateForward('/entry/new');
  }

  deleteEntry(id: number): void {
    this.journalService.delete(id).subscribe({
      next: () => this.entries.update((list) => list.filter((e) => e.id !== id)),
      error: () => this.errorMessage.set('Günlük silinemedi.'),
    });
  }
}