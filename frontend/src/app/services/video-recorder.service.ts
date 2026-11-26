import { Injectable } from '@angular/core';

/** Kaydedilmiş ama henüz yüklenmemiş video */
export interface RecordedVideo {
  previewUrl: string;
  blob: Blob;
  fileName: string;
  durationSec: number;
}

@Injectable({
  providedIn: 'root',
})
export class VideoRecorderService {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  /** Kamera + mikrofon izni ister, canlı görüntü akışını döndürür */
  async openCamera(): Promise<MediaStream> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // telefonda arka kamera
      audio: true,
    });
    return this.stream;
  }

  /** Açık kameradan kaydı başlatır */
  startRecording(): void {
    if (!this.stream) {
      throw new Error('Camera is not open');
    }

    const mimeType = this.pickMimeType();
    const options: MediaRecorderOptions = { videoBitsPerSecond: 2_500_000 };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    this.recorder = new MediaRecorder(this.stream, options);
    this.chunks = [];
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
    this.recorder.start();
    this.startedAt = Date.now();
  }

  /** Kaydı durdurur, kamerayı kapatır ve video dosyasını döndürür */
  stop(): Promise<RecordedVideo> {
    return new Promise((resolve, reject) => {
      const recorder = this.recorder;
      if (!recorder) {
        reject(new Error('Recording has not started'));
        return;
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type });
        const extension = type.split(';')[0].split('/')[1] || 'webm';
        const durationSec = Math.round((Date.now() - this.startedAt) / 1000);

        this.cleanup();

        resolve({
          previewUrl: URL.createObjectURL(blob),
          blob,
          fileName: `video-${Date.now()}.${extension}`,
          durationSec,
        });
      };

      recorder.stop();
    });
  }

  /** Kaydı iptal eder ve kamerayı kapatır */
  cancel(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }

  /** Tarayıcının desteklediği ilk video formatını seçer */
  private pickMimeType(): string | undefined {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
  }
}