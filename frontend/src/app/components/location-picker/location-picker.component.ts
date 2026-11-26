import {
  AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { createPinIcon } from '../../utils/map-pin';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-picker',
  template: `<div #mapContainer class="map"></div>`,
  styles: [`
    :host {
      display: block;
    }
    .map {
      height: 220px;
      border-radius: 12px;
      overflow: hidden;
      z-index: 0;
    }
  `],
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  // Dışarıdan gelen değerler: <app-location-picker [latitude]="..." ...>
  latitude = input.required<number>();
  longitude = input.required<number>();
  draggable = input(true);
  pinEmoji = input('📍');

  // Dışarıya gönderilen olay: (locationChange)="..."
  locationChange = output<GeoPoint>();

  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor() {
    // latitude/longitude dışarıdan değişince pini ve haritayı güncelle
    effect(() => {
      const point: L.LatLngExpression = [this.latitude(), this.longitude()];
      if (this.map && this.marker) {
        this.marker.setLatLng(point);
        this.map.panTo(point);
      }
    });
  }

  ngAfterViewInit(): void {
    const point: L.LatLngExpression = [this.latitude(), this.longitude()];

    this.map = L.map(this.mapContainer().nativeElement).setView(point, 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.marker = L.marker(point, {
      draggable: this.draggable(),
      icon: createPinIcon(this.pinEmoji()),
    }).addTo(this.map);

    if (this.draggable()) {
      // Pin sürüklenip bırakılınca
      this.marker.on('dragend', () => this.emitPosition(this.marker!.getLatLng()));

      // Haritada bir yere dokununca pini oraya taşı
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        this.marker!.setLatLng(event.latlng);
        this.emitPosition(event.latlng);
      });
    }

    // Ionic sayfa animasyonu bitince harita boyutunu yeniden hesapla
    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  ngOnDestroy(): void {
    this.map?.remove(); // haritayı ve olay dinleyicilerini temizle
    this.map = null;
  }

  private emitPosition(latLng: L.LatLng): void {
    this.locationChange.emit({ latitude: latLng.lat, longitude: latLng.lng });
  }
}