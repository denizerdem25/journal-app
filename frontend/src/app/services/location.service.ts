import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

export interface CurrentPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // metre
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {

  /** Cihazın şu anki konumunu alır */
  async getCurrentPosition(): Promise<CurrentPosition> {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, // mümkünse GPS kullan
      timeout: 15000,           // 15 saniyede bulamazsa hata ver
      maximumAge: 0,            // önbellekteki eski konumu kullanma
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy),
    };
  }

  /** Koordinattan okunabilir yer adı bulur: "Bilkent, Ankara" gibi */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${latitude}&lon=${longitude}&zoom=16&accept-language=tr`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const address = data.address ?? {};

      const place = address.neighbourhood ?? address.suburb ?? address.quarter ?? address.village;
      const city = address.city ?? address.town ?? address.province;

      const parts = [place, city].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null);
    } catch {
      return null; // internet yoksa veya servis cevap vermezse isim olmadan devam
    }
  }
}