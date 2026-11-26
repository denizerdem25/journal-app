import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonInput, IonTextarea, IonIcon, IonSpinner,
  ActionSheetController, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline, imagesOutline, micOutline, videocamOutline,
  musicalNotesOutline, locationOutline, closeCircle, stop,
} from 'ionicons/icons';
import { JournalService } from '../../services/journal.service';
import { PhotoService, PickedPhoto } from '../../services/photo.service';
import { AudioRecorderService, RecordedAudio } from '../../services/audio-recorder.service';
import { JournalEntryRequest, MediaFile } from '../../models/journal-entry.model';
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
  private photoService = inject(PhotoService);
  private audioRecorder = inject(AudioRecorderService);
  private actionSheetCtrl = inject(ActionSheetController);
  private navCtrl = inject(NavController);

  private entryId: number | null = null;
  isEditMode = false;

  loaded = signal(false);
  saving = signal(false);
  errorMessage = signal('');

  form: JournalEntryRequest = { title: '', content: '', mood: 'happy' };
  moods = MOODS;

  // Kayıtlı medya (backend'den gelenler)
  existingPhotos = signal<MediaFile[]>([]);
  existingAudios = signal<MediaFile[]>([]);

  // Yeni eklenen, henüz yüklenmemiş medya
  newPhotos = signal<PickedPhoto[]>([]);
  newAudios = signal<RecordedAudio[]>([]);

  // ✕ ile kaldırılan kayıtlı medyanın id'leri (kaydedince silinecek)
  private removedMediaIds: number[] = [];

  // Ses kaydı durumu
  isRecording = signal(false);
  recordingSeconds = signal(0);
  private recordingTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({
      cameraOutline, imagesOutline, micOutline, videocamOutline,
      musicalNotesOutline, locationOutline, closeCircle, stop,
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.entryId = Number(idParam);
      this.loadEntry(this.entryId);
    } else {
      this.loaded.set(true);
    }
  }

  // Sayfadan çıkılırken kayıt sürüyorsa mikrofonu kapat
  ionViewWillLeave(): void {
    if (this.isRecording()) {
      this.cancelRecording();
    }
  }

  // ---------- Ruh hali ----------

  selectMood(value: string): void {
    this.form.mood = value;
  }

  // ---------- Fotoğraflar ----------

  async addPhoto(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Fotoğraf ekle',
      buttons: [
        { text: 'Fotoğraf çek', icon: 'camera-outline', handler: () => { this.takePhoto(); } },
        { text: 'Galeriden seç', icon: 'images-outline', handler: () => { this.pickFromGallery(); } },
        { text: 'Vazgeç', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  removeNewPhoto(index: number): void {
    this.newPhotos.update((list) => list.filter((_, i) => i !== index));
  }

  private async takePhoto(): Promise<void> {
    try {
      const photo = await this.photoService.takePhoto();
      this.newPhotos.update((list) => [...list, photo]);
    } catch {
      // Kullanıcı kamerayı kapattı veya izin vermedi
    }
  }

  private async pickFromGallery(): Promise<void> {
    try {
      const photos = await this.photoService.chooseFromGallery();
      this.newPhotos.update((list) => [...list, ...photos]);
    } catch {
      // Kullanıcı seçimi iptal etti
    }
  }

  // ---------- Ses kaydı ----------

  async startRecording(): Promise<void> {
    try {
      await this.audioRecorder.start();
    } catch {
      this.errorMessage.set('Mikrofona erişilemedi. Tarayıcı izinlerini kontrol et.');
      return;
    }
    this.errorMessage.set('');
    this.recordingSeconds.set(0);
    this.isRecording.set(true);
    this.recordingTimer = setInterval(() => {
      this.recordingSeconds.update((s) => s + 1);
    }, 1000);
  }

  async stopRecording(): Promise<void> {
    this.clearTimer();
    this.isRecording.set(false);
    try {
      const audio = await this.audioRecorder.stop();
      this.newAudios.update((list) => [...list, audio]);
    } catch {
      this.errorMessage.set('Ses kaydı alınamadı.');
    }
  }

  cancelRecording(): void {
    this.clearTimer();
    this.audioRecorder.cancel();
    this.isRecording.set(false);
  }

  removeNewAudio(index: number): void {
    const audio = this.newAudios()[index];
    URL.revokeObjectURL(audio.previewUrl); // geçici adresi bellekten temizle
    this.newAudios.update((list) => list.filter((_, i) => i !== index));
  }

  /** 75 → "01:15" */
  formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private clearTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  // ---------- Ortak medya ----------

  /** Kayıtlı bir fotoğraf veya sesi listeden kaldırır (kaydedince silinir) */
  removeExistingMedia(media: MediaFile): void {
    this.existingPhotos.update((list) => list.filter((m) => m.id !== media.id));
    this.existingAudios.update((list) => list.filter((m) => m.id !== media.id));
    this.removedMediaIds.push(media.id);
  }

  mediaUrl(id: number): string {
    return this.journalService.mediaUrl(id);
  }

  // ---------- Kaydetme ----------

  canSave(): boolean {
    return this.form.title.trim().length > 0 && !this.saving() && !this.isRecording();
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.errorMessage.set('');

    const wasNew = !this.isEditMode;

    const saveEntry$ =
      this.isEditMode && this.entryId !== null
        ? this.journalService.update(this.entryId, this.form)
        : this.journalService.create(this.form);

    saveEntry$
      .pipe(
        switchMap((saved) => {
          // Medya yüklemesi hata verip tekrar denenirse yeni günlük açılmasın
          this.entryId = saved.id;
          this.isEditMode = true;
          return this.syncMedia(saved.id).pipe(map(() => saved));
        }),
      )
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          if (wasNew) {
            this.navCtrl.navigateBack('/home');
          } else {
            this.navCtrl.navigateBack(['/entry', saved.id]);
          }
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('Kaydedilemedi. Tekrar dene.');
        },
      });
  }

  /** Yeni fotoğraf ve sesleri yükler, kaldırılanları siler */
  private syncMedia(entryId: number): Observable<unknown> {
    const photoUploads = this.newPhotos().map((p) =>
      this.journalService.uploadMedia(entryId, p.blob, p.fileName, 'PHOTO'),
    );
    const audioUploads = this.newAudios().map((a) =>
      this.journalService.uploadMedia(entryId, a.blob, a.fileName, 'AUDIO'),
    );
    const deletions = this.removedMediaIds.map((id) => this.journalService.deleteMedia(id));

    const requests: Observable<unknown>[] = [...photoUploads, ...audioUploads, ...deletions];
    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  private loadEntry(id: number): void {
    this.journalService.getById(id).subscribe({
      next: (entry) => {
        this.form = {
          title: entry.title,
          content: entry.content ?? '',
          mood: entry.mood ?? 'happy',
        };
        this.existingPhotos.set(entry.media.filter((m) => m.type === 'PHOTO'));
        this.existingAudios.set(entry.media.filter((m) => m.type === 'AUDIO'));
        this.loaded.set(true);
      },
      error: () => {
        this.errorMessage.set('Günlük yüklenemedi.');
        this.loaded.set(true);
      },
    });
  }
}