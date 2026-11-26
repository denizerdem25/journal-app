import { Injectable } from '@angular/core';

/** Kaydedilmiş ama henüz yüklenmemiş ses */
export interface RecordedAudio {
  previewUrl: string;  // formda dinlemek için
  blob: Blob;          // backend'e gönderilecek veri
  fileName: string;
  durationSec: number;
}

@Injectable({
  providedIn: 'root',
})
export class AudioRecorderService {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  /** Mikrofon izni ister ve kaydı başlatır */
  async start(): Promise<void> {
    if (this.recorder) return; // zaten kayıt yapılıyor

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = this.pickMimeType();
    this.recorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);

    this.chunks = [];
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.recorder.start();
    this.startedAt = Date.now();
  }

  /** Kaydı durdurur ve ses dosyasını döndürür */
  stop(): Promise<RecordedAudio> {
    return new Promise((resolve, reject) => {
      const recorder = this.recorder;
      if (!recorder) {
        reject(new Error('Recording has not started'));
        return;
      }

      // MediaRecorder durunca bu fonksiyon çağrılır
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        const extension = type.split(';')[0].split('/')[1] || 'webm';
        const durationSec = Math.round((Date.now() - this.startedAt) / 1000);

        this.cleanup();

        resolve({
          previewUrl: URL.createObjectURL(blob),
          blob,
          fileName: `voice-${Date.now()}.${extension}`,
          durationSec,
        });
      };

      recorder.stop();
    });
  }

  /** Kaydı iptal eder, veriyi atar */
  cancel(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.onstop = null; // sonuç üretme
      this.recorder.stop();
    }
    this.cleanup();
  }

  /** Mikrofonu kapatır ve durumu sıfırlar */
  private cleanup(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }

  /** Tarayıcının desteklediği ilk ses formatını seçer */
  private pickMimeType(): string | undefined {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
  }
}