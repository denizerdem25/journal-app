import {
  AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon,
  IonSpinner, NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, locateOutline } from 'ionicons/icons';
import * as L from 'leaflet';
import { JournalService } from '../../services/journal.service';
import { LocationService } from '../../services/location.service';
import { moodEmoji } from '../../models/moods';
import {
  PIN_SPACING_X, PIN_SPACING_Y, PinOffset, createEntryPinIcon,
} from '../../utils/map-pin';
import { LocatedEntry, firstPhotoId, hasLocation, mediaSummary } from '../../utils/entry-utils';

const TURKEY_CENTER: L.LatLngTuple = [39.0, 35.0];

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonSpinner,
  ],
})
export class MapPage implements AfterViewInit, OnDestroy {
  private journalService = inject(JournalService);
  private locationService = inject(LocationService);
  private navCtrl = inject(NavController);

  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map: L.Map | null = null;
  private markersLayer = L.layerGroup();
  private userMarker: L.CircleMarker | null = null;
  private hasFittedBounds = false;

  entries = signal<LocatedEntry[]>([]);
  selectedEntry = signal<LocatedEntry | null>(null);
  loaded = signal(false);
  locating = signal(false);
  errorMessage = signal('');

  // HTML'den kullanmak için
  moodEmoji = moodEmoji;
  mediaSummary = mediaSummary;
  firstPhotoId = firstPhotoId;

  constructor() {
    addIcons({ close, locateOutline });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement).setView(TURKEY_CENTER, 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Haritada boş bir yere dokununca özet kartını kapat
    this.map.on('click', () => this.selectedEntry.set(null));

    this.renderMarkers();
  }

  ionViewWillEnter(): void {
    this.loadEntries();
  }

  ionViewDidEnter(): void {
    this.map?.invalidateSize();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  openEntry(id: number): void {
    this.navCtrl.navigateForward(['/entry', id]);
  }

  closeCard(event: Event): void {
    event.stopPropagation();
    this.selectedEntry.set(null);
  }

  mediaUrl(id: number): string {
    return this.journalService.mediaUrl(id);
  }

  async locateMe(): Promise<void> {
    if (!this.map) return;
    this.locating.set(true);
    this.errorMessage.set('');

    try {
      const position = await this.locationService.getCurrentPosition();
      const point: L.LatLngTuple = [position.latitude, position.longitude];

      this.userMarker?.remove();
      this.userMarker = L.circleMarker(point, {
        radius: 8,
        color: 'white',
        weight: 3,
        fillColor: '#3880ff',
        fillOpacity: 1,
      }).addTo(this.map);

      this.map.setView(point, 15);
    } catch {
      this.errorMessage.set('Konum alınamadı. Konum iznini kontrol et.');
    } finally {
      this.locating.set(false);
    }
  }

  private loadEntries(): void {
    this.journalService.getAll().subscribe({
      next: (entries) => {
        const located = entries.filter(hasLocation);
        this.entries.set(located);

        const selected = this.selectedEntry();
        if (selected) {
          this.selectedEntry.set(located.find((e) => e.id === selected.id) ?? null);
        }

        this.loaded.set(true);
        this.errorMessage.set('');
        this.renderMarkers();
      },
      error: () => {
        this.loaded.set(true);
        this.errorMessage.set('Günlükler yüklenemedi. Backend çalışıyor mu?');
      },
    });
  }

  /** Bütün pinleri silip güncel listeye göre yeniden çizer */
  private renderMarkers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();
    const points: L.LatLngTuple[] = [];

    for (const group of this.groupByPosition(this.entries())) {
      group.forEach((entry, index) => {
        const point: L.LatLngTuple = [entry.latitude, entry.longitude];
        points.push(point);

        const photoId = firstPhotoId(entry);
        const icon = createEntryPinIcon(
          photoId !== null ? this.mediaUrl(photoId) : null,
          moodEmoji(entry.mood),
          this.offsetFor(index, group.length),
        );

        L.marker(point, { icon })
          .on('click', () => {
            this.selectedEntry.set(entry);
            this.map?.panTo(point);
          })
          .addTo(this.markersLayer);
      });
    }

    if (!this.hasFittedBounds && points.length > 0) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [70, 70], maxZoom: 15 });
      this.hasFittedBounds = true;
    }
  }

  /**
   * Birbirine çok yakın (≈ 10 m) günlükleri aynı grupta toplar.
   * Koordinatları 4 ondalık basamağa yuvarlayıp anahtar olarak kullanır.
   */
  private groupByPosition(entries: LocatedEntry[]): LocatedEntry[][] {
    const groups = new Map<string, LocatedEntry[]>();

    for (const entry of entries) {
      const key = `${entry.latitude.toFixed(4)},${entry.longitude.toFixed(4)}`;
      const group = groups.get(key);
      if (group) {
        group.push(entry);
      } else {
        groups.set(key, [entry]);
      }
    }

    return [...groups.values()];
  }

  /**
   * Gruptaki pinlerin ekrandaki yerini hesaplar:
   * 2 → yan yana, 3 → üçlü sıra, 4 → 2×2, 5–9 → 3 sütunlu ızgara...
   * Satırlar yukarı doğru dizilir; her satır kendi içinde ortalanır.
   */
  private offsetFor(index: number, count: number): PinOffset {
    if (count === 1) {
      return { x: 0, y: 0 };
    }

    const columns = Math.ceil(Math.sqrt(count));
    const row = Math.floor(index / columns);
    const column = index % columns;
    const itemsInRow = Math.min(columns, count - row * columns);

    return {
      x: (column - (itemsInRow - 1) / 2) * PIN_SPACING_X,
      y: -row * PIN_SPACING_Y,
    };
  }
}