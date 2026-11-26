import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
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
import { VideoRecorderService } from '../../services/video-recorder.service';
import { LocationService } from '../../services/location.service';
import {
  GeoPoint, LocationPickerComponent,
} from '../../components/location-picker/location-picker.component';
import { JournalEntryRequest, MediaFile } from '../../models/journal-entry.model';
import { MOODS } from '../../models/moods';

/** Seçilmiş veya çekilmiş, henüz yüklenmemiş video */
interface PendingVideo {
  previewUrl: string;
  blob: Blob;
  fileName: string;
}

const MAX_VIDEO_MB = 100;

@Component({
  selector: 'app-entry-form',
  templateUrl: 'entry-form.page.html',
  styleUrls: ['entry-form.page.scss'],
  imports: [
    FormsModule, LocationPickerComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonInput, IonTextarea, IonIcon, IonSpinner,
  ],
})
export class EntryFormPage {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);
  private photoService = inject(PhotoService);
  private audioRecorder = inject(AudioRecorderService);
  private videoRecorder = inject(VideoRecorderService);
  private locationService = inject(LocationService);
  private actionSheetCtrl = inject(ActionSheetController);
  private navCtrl = inject(NavController);

  // HTML'deki elemanlara erişim
  private videoInput = viewChild.required<ElementRef<HTMLInputElement>>('videoInput');
  private cameraPreview = viewChild.required<ElementRef<HTMLVideoElement>>('cameraPreview');

  private entryId: number | null = null;
  isEditMode = false;

  loaded = signal(false);
  saving = signal(false);
  errorMessage = signal('');

  // Metin alanları (ngModel ile bağlı)
  form = { title: '', content: '', mood: 'happy' };
  moods = MOODS;

  // Kayıtlı medya (backend'den gelenler)
  existingPhotos = signal<MediaFile[]>([]);
  existingAudios = signal<MediaFile[]>([]);
  existingVideos = signal<MediaFile[]>([]);

  // Yeni eklenen, henüz yüklenmemiş medya
  newPhotos = signal<PickedPhoto[]>([]);
  newAudios = signal<RecordedAudio[]>([]);
  newVideos = signal<PendingVideo[]>([]);

  // ✕ ile kaldırılan kayıtlı medyanın id'leri (kaydedince silinecek)
  private removedMediaIds: number[] = [];

  // Ses kaydı durumu
  isRecording = signal(false);
  recordingSeconds = signal(0);
  private recordingTimer: ReturnType<typeof setInterval> | null = null;

  // Video kaydı durumu
  isVideoRecording = signal(false);
  videoSeconds = signal(0);
  private videoTimer: ReturnType<typeof setInterval> | null = null;

  // Konum durumu
  location = signal<GeoPoint | null>(null);
  locationName = signal('');
  locationAccuracy = signal<number | null>(null); // null = haritadan elle seçildi
  locating = signal(false);
  private locationNameEdited = false; // kullanıcı ismi kendisi yazdıysa üzerine yazma

  // Herhangi bir kayıt sürüyor mu? (butonları kilitlemek için)
  isBusy = computed(() => this.isRecording() || this.isVideoRecording());

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

  // Sayfadan çıkılırken kayıt sürüyorsa mikrofonu ve kamerayı kapat
  ionViewWillLeave(): void {
    if (this.isRecording()) {
      this.cancelRecording();
    }
    if (this.isVideoRecording()) {
      this.cancelVideoRecording();
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
    this.clearRecordingTimer();
    this.isRecording.set(false);
    try {
      const audio = await this.audioRecorder.stop();
      this.newAudios.update((list) => [...list, audio]);
    } catch {
      this.errorMessage.set('Ses kaydı alınamadı.');
    }
  }

  cancelRecording(): void {
    this.clearRecordingTimer();
    this.audioRecorder.cancel();
    this.isRecording.set(false);
  }

  removeNewAudio(index: number): void {
    URL.revokeObjectURL(this.newAudios()[index].previewUrl);
    this.newAudios.update((list) => list.filter((_, i) => i !== index));
  }

  private clearRecordingTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  // ---------- Video ----------

  async addVideo(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Video ekle',
      buttons: [
        { text: 'Video çek', icon: 'videocam-outline', handler: () => { this.startVideoRecording(); } },
        { text: 'Galeriden seç', icon: 'images-outline', handler: () => { this.openVideoPicker(); } },
        { text: 'Vazgeç', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async startVideoRecording(): Promise<void> {
    const preview = this.cameraPreview().nativeElement;

    try {
      const stream = await this.videoRecorder.openCamera();
      preview.srcObject = stream;
      preview.muted = true;
      await preview.play().catch(() => {});
      this.videoRecorder.startRecording();
    } catch {
      this.videoRecorder.cancel();
      preview.srcObject = null;
      this.errorMessage.set('Kameraya erişilemedi. Tarayıcı izinlerini kontrol et.');
      return;
    }

    this.errorMessage.set('');
    this.videoSeconds.set(0);
    this.isVideoRecording.set(true);
    this.videoTimer = setInterval(() => {
      this.videoSeconds.update((s) => s + 1);
    }, 1000);
  }

  async stopVideoRecording(): Promise<void> {
    this.clearVideoTimer();
    this.isVideoRecording.set(false);
    this.cameraPreview().nativeElement.srcObject = null;

    try {
      const video = await this.videoRecorder.stop();
      this.newVideos.update((list) => [
        ...list,
        { previewUrl: video.previewUrl, blob: video.blob, fileName: video.fileName },
      ]);
    } catch {
      this.errorMessage.set('Video kaydı alınamadı.');
    }
  }

  cancelVideoRecording(): void {
    this.clearVideoTimer();
    this.videoRecorder.cancel();
    this.cameraPreview().nativeElement.srcObject = null;
    this.isVideoRecording.set(false);
  }

  openVideoPicker(): void {
    this.videoInput().nativeElement.click();
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        this.errorMessage.set(`"${file.name}" bir video dosyası değil.`);
        continue;
      }
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        this.errorMessage.set(`"${file.name}" ${MAX_VIDEO_MB} MB'tan büyük.`);
        continue;
      }
      this.newVideos.update((list) => [
        ...list,
        { previewUrl: URL.createObjectURL(file), blob: file, fileName: file.name },
      ]);
    }
  }

  removeNewVideo(index: number): void {
    URL.revokeObjectURL(this.newVideos()[index].previewUrl);
    this.newVideos.update((list) => list.filter((_, i) => i !== index));
  }

  private clearVideoTimer(): void {
    if (this.videoTimer) {
      clearInterval(this.videoTimer);
      this.videoTimer = null;
    }
  }

  // ---------- Konum ----------

  /** GPS ile mevcut konumu alır ve yer adını bulur */
  async addLocation(): Promise<void> {
    this.locating.set(true);
    this.errorMessage.set('');

    try {
      const position = await this.locationService.getCurrentPosition();
      this.location.set({ latitude: position.latitude, longitude: position.longitude });
      this.locationAccuracy.set(position.accuracy);
      this.locationNameEdited = false;
      await this.updateLocationName();
    } catch {
      this.errorMessage.set('Konum alınamadı. Konum iznini ve GPS\'i kontrol et.');
    } finally {
      this.locating.set(false);
    }
  }

  /** Harita bileşeni "pin taşındı" dediğinde */
  async onPinMoved(point: GeoPoint): Promise<void> {
    this.location.set(point);
    this.locationAccuracy.set(null); // artık GPS değil, elle seçildi
    await this.updateLocationName();
  }

  /** Kullanıcı yer adı kutusuna yazdığında */
  onLocationNameInput(value: string): void {
    this.locationName.set(value);
    this.locationNameEdited = true;
  }

  removeLocation(): void {
    this.location.set(null);
    this.locationName.set('');
    this.locationAccuracy.set(null);
    this.locationNameEdited = false;
  }

  private async updateLocationName(): Promise<void> {
    const point = this.location();
    if (!point || this.locationNameEdited) return;

    const name = await this.locationService.reverseGeocode(point.latitude, point.longitude);
    if (name && !this.locationNameEdited) {
      this.locationName.set(name);
    }
  }

  // ---------- Ortak ----------

  /** 75 → "01:15" */
  formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  removeExistingMedia(media: MediaFile): void {
    this.existingPhotos.update((list) => list.filter((m) => m.id !== media.id));
    this.existingAudios.update((list) => list.filter((m) => m.id !== media.id));
    this.existingVideos.update((list) => list.filter((m) => m.id !== media.id));
    this.removedMediaIds.push(media.id);
  }

  mediaUrl(id: number): string {
    return this.journalService.mediaUrl(id);
  }

  // ---------- Kaydetme ----------

  canSave(): boolean {
    return this.form.title.trim().length > 0 && !this.saving() && !this.isBusy();
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.errorMessage.set('');

    const wasNew = !this.isEditMode;
    const request = this.buildRequest();

    const saveEntry$ =
      this.isEditMode && this.entryId !== null
        ? this.journalService.update(this.entryId, request)
        : this.journalService.create(request);

    saveEntry$
      .pipe(
        switchMap((saved) => {
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

  /** Form alanlarını ve konumu backend'e gidecek isteğe dönüştürür */
  private buildRequest(): JournalEntryRequest {
    const point = this.location();
    return {
      ...this.form,
      latitude: point?.latitude ?? null,
      longitude: point?.longitude ?? null,
      locationName: point ? this.locationName().trim() || null : null,
    };
  }

  private syncMedia(entryId: number): Observable<unknown> {
    const photoUploads = this.newPhotos().map((p) =>
      this.journalService.uploadMedia(entryId, p.blob, p.fileName, 'PHOTO'),
    );
    const audioUploads = this.newAudios().map((a) =>
      this.journalService.uploadMedia(entryId, a.blob, a.fileName, 'AUDIO'),
    );
    const videoUploads = this.newVideos().map((v) =>
      this.journalService.uploadMedia(entryId, v.blob, v.fileName, 'VIDEO'),
    );
    const deletions = this.removedMediaIds.map((id) => this.journalService.deleteMedia(id));

    const requests: Observable<unknown>[] = [
      ...photoUploads, ...audioUploads, ...videoUploads, ...deletions,
    ];
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

        if (entry.latitude !== null && entry.longitude !== null) {
          this.location.set({ latitude: entry.latitude, longitude: entry.longitude });
          this.locationName.set(entry.locationName ?? '');
        }

        this.existingPhotos.set(entry.media.filter((m) => m.type === 'PHOTO'));
        this.existingAudios.set(entry.media.filter((m) => m.type === 'AUDIO'));
        this.existingVideos.set(entry.media.filter((m) => m.type === 'VIDEO'));
        this.loaded.set(true);
      },
      error: () => {
        this.errorMessage.set('Günlük yüklenemedi.');
        this.loaded.set(true);
      },
    });
  }
}