import { Injectable } from '@angular/core';
import { Camera, MediaTypeSelection } from '@capacitor/camera';

/** Seçilmiş ama henüz yüklenmemiş fotoğraf */
export interface PickedPhoto {
  previewUrl: string; // ekranda önizleme için
  blob: Blob;         // backend'e gönderilecek ham veri
  fileName: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {

  /** Kamerayı açar, çekilen fotoğrafı döndürür */
  async takePhoto(): Promise<PickedPhoto> {
    const result = await Camera.takePhoto({ quality: 80 });
    return this.toPickedPhoto(result.webPath!);
  }

  /** Galeriyi açar, seçilen fotoğrafları döndürür (çoklu seçim) */
  async chooseFromGallery(): Promise<PickedPhoto[]> {
    const { results } = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: true,
      limit: 10,
    });
    return Promise.all(results.map((r) => this.toPickedPhoto(r.webPath!)));
  }

  /** Fotoğrafın adresinden (webPath) yüklenebilir bir Blob üretir */
  private async toPickedPhoto(webPath: string): Promise<PickedPhoto> {
    const response = await fetch(webPath);
    let blob = await response.blob();

    // Tür bilgisi boş gelirse backend reddeder; JPEG olarak işaretle
    if (!blob.type) {
      blob = new Blob([blob], { type: 'image/jpeg' });
    }

    const extension = blob.type.split('/')[1] ?? 'jpg';
    return {
      previewUrl: webPath,
      blob,
      fileName: `photo-${Date.now()}.${extension}`,
    };
  }
}