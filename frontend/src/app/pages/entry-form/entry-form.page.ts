import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonInput, IonTextarea, IonIcon, IonSpinner, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline, micOutline, videocamOutline, musicalNotesOutline, locationOutline,
} from 'ionicons/icons';
import { JournalService } from '../../services/journal.service';
import { JournalEntryRequest } from '../../models/journal-entry.model';
import { MOODS } from '../../models/moods';

@Component({
  selector: 'app-entry-form',
  templateUrl: 'entry-form.page.html',
  styleUrls: ['entry-form.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonInput, IonTextarea, IonIcon, IonSpinner,
  ],
})
export class EntryFormPage {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);
  private navCtrl = inject(NavController);

  private entryId: number | null = null;
  isEditMode = false;

  loaded = signal(false);  // düzenlemede veri gelene kadar false
  saving = signal(false);  // kaydetme sürerken butonu kilitlemek için
  errorMessage = signal('');

  form: JournalEntryRequest = { title: '', content: '', mood: 'happy' };
  moods = MOODS;

  constructor() {
    addIcons({ cameraOutline, micOutline, videocamOutline, musicalNotesOutline, locationOutline });

    // Adreste id var mı? "/entry/5/edit" → var (düzenleme), "/entry/new" → yok (yeni)
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.entryId = Number(idParam);
      this.loadEntry(this.entryId);
    } else {
      this.loaded.set(true); // yeni günlükte beklenecek veri yok
    }
  }

  selectMood(value: string): void {
    this.form.mood = value;
  }

  canSave(): boolean {
    return this.form.title.trim().length > 0 && !this.saving();
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);

    // Moda göre doğru istek: düzenlemede PUT, yenide POST
    const request$ =
      this.isEditMode && this.entryId !== null
        ? this.journalService.update(this.entryId, this.form)
        : this.journalService.create(this.form);

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.isEditMode) {
          this.navCtrl.navigateBack(['/entry', saved.id]); // detaya dön
        } else {
          this.navCtrl.navigateBack('/home');              // listeye dön
        }
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Kaydedilemedi. Tekrar dene.');
      },
    });
  }

  private loadEntry(id: number): void {
    this.journalService.getById(id).subscribe({
      next: (entry) => {
        // Formu mevcut değerlerle doldur
        this.form = {
          title: entry.title,
          content: entry.content ?? '',
          mood: entry.mood ?? 'happy',
        };
        this.loaded.set(true);
      },
      error: () => {
        this.errorMessage.set('Günlük yüklenemedi.');
        this.loaded.set(true);
      },
    });
  }
}