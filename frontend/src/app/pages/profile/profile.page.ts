import { Component, computed, inject, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../models/journal-entry.model';
import { countMedia, hasLocation } from '../../utils/entry-utils';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class ProfilePage {
  private journalService = inject(JournalService);

  private entries = signal<JournalEntry[]>([]);

  // entries değişince otomatik hesaplanan istatistikler
  stats = computed(() => {
    const list = this.entries();
    const sum = (fn: (e: JournalEntry) => number) => list.reduce((total, e) => total + fn(e), 0);

    return [
      { icon: '📔', label: 'Günlük', value: list.length },
      { icon: '📍', label: 'Konumlu', value: list.filter(hasLocation).length },
      { icon: '📷', label: 'Fotoğraf', value: sum((e) => countMedia(e, 'PHOTO')) },
      { icon: '🎤', label: 'Ses kaydı', value: sum((e) => countMedia(e, 'AUDIO')) },
      { icon: '🎬', label: 'Video', value: sum((e) => countMedia(e, 'VIDEO')) },
    ];
  });

  ionViewWillEnter(): void {
    this.journalService.getAll().subscribe({
      next: (entries) => this.entries.set(entries),
    });
  }
}