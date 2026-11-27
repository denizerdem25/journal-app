import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
  IonRefresher, IonRefresherContent, IonNote, IonThumbnail, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';
import { JournalService } from '../services/journal.service';
import { JournalEntry } from '../models/journal-entry.model';
import { moodEmoji } from '../models/moods';
import { firstPhotoId, mediaSummary } from '../utils/entry-utils';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
    IonRefresher, IonRefresherContent, IonNote, IonThumbnail,
  ],
})
export class HomePage {
  private journalService = inject(JournalService);
  private navCtrl = inject(NavController);

  entries = signal<JournalEntry[]>([]);
  errorMessage = signal('');

  // HTML'den kullanmak için
  moodEmoji = moodEmoji;
  firstPhotoId = firstPhotoId;
  mediaSummary = mediaSummary;

  constructor() {
    addIcons({ trash });
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

  mediaUrl(id: number): string {
    return this.journalService.mediaUrl(id);
  }

  openEntry(id: number): void {
    this.navCtrl.navigateForward(['/entry', id]);
  }

  deleteEntry(id: number): void {
    this.journalService.delete(id).subscribe({
      next: () => this.entries.update((list) => list.filter((e) => e.id !== id)),
      error: () => this.errorMessage.set('Günlük silinemedi.'),
    });
  }
}