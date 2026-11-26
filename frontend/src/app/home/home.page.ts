import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonIcon,
  IonRefresher, IonRefresherContent, IonNote, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';
import { JournalService } from '../services/journal.service';
import { JournalEntry } from '../models/journal-entry.model';
import { moodEmoji } from '../models/moods';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonIcon,
    IonRefresher, IonRefresherContent, IonNote,
  ],
})
export class HomePage {
  private journalService = inject(JournalService);
  private navCtrl = inject(NavController);

  entries = signal<JournalEntry[]>([]);
  errorMessage = signal('');

  // HTML'den çağırabilmek için ortak fonksiyonu sınıfa bağlıyoruz
  moodEmoji = moodEmoji;

  constructor() {
    addIcons({ add, trash });
  }

  // Ionic: sayfa her ekrana geldiğinde çalışır (ilk açılış + geri dönüşler)
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