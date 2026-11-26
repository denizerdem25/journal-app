import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, AlertController, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../models/journal-entry.model';
import { moodEmoji, moodLabel } from '../../models/moods';

@Component({
  selector: 'app-entry-detail',
  templateUrl: 'entry-detail.page.html',
  styleUrls: ['entry-detail.page.scss'],
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner,
  ],
})
export class EntryDetailPage {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);

  // Adresteki :id değerini okuyup sayıya çeviriyoruz: "/entry/5" → 5
  private id = Number(this.route.snapshot.paramMap.get('id'));

  entry = signal<JournalEntry | null>(null);
  errorMessage = signal('');

  moodEmoji = moodEmoji;
  moodLabel = moodLabel;

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  // Düzenlemeden geri dönünce güncel hâli görmek için her girişte yeniden yükle
  ionViewWillEnter(): void {
    this.journalService.getById(this.id).subscribe({
      next: (entry) => this.entry.set(entry),
      error: () => this.errorMessage.set('Günlük bulunamadı.'),
    });
  }

  editEntry(): void {
    this.navCtrl.navigateForward(['/entry', this.id, 'edit']);
  }

  async confirmDelete(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Günlüğü sil',
      message: 'Bu günlük kalıcı olarak silinecek. Emin misin?',
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        { text: 'Sil', role: 'destructive', handler: () => this.deleteEntry() },
      ],
    });
    await alert.present();
  }

  wasEdited(entry: JournalEntry): boolean {
    return entry.updatedAt !== entry.createdAt;
  }

  private deleteEntry(): void {
    this.journalService.delete(this.id).subscribe({
      next: () => this.navCtrl.navigateBack('/home'),
      error: () => this.errorMessage.set('Günlük silinemedi.'),
    });
  }
}