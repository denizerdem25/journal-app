import * as L from 'leaflet';

/** Basit emoji pin (konum seçicide kullanılıyor): 📍 */
export function createPinIcon(emoji = '📍'): L.DivIcon {
  return L.divIcon({
    className: 'journal-pin',
    html: `<span>${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

// Fotoğraflı pin ölçüleri (piksel)
const BUBBLE_SIZE = 52;  // yuvarlak baloncuğun çapı
const TAIL_HEIGHT = 8;   // alttaki üçgen ucun yüksekliği

// Aynı yerdeki pinler arasındaki mesafe
export const PIN_SPACING_X = BUBBLE_SIZE + 4;
export const PIN_SPACING_Y = BUBBLE_SIZE + TAIL_HEIGHT + 4;

/** Ekranda pinin kaydırılacağı miktar (sağa +x, aşağı +y) */
export interface PinOffset {
  x: number;
  y: number;
}

/**
 * Günlük pini: fotoğraf varsa fotoğraf, yoksa ruh hali emojisi.
 * offset verilirse pin, koordinatından o kadar piksel kaydırılmış görünür.
 */
export function createEntryPinIcon(
  photoUrl: string | null,
  emoji: string,
  offset: PinOffset = { x: 0, y: 0 },
): L.DivIcon {
  const inner = photoUrl ? `<img src="${photoUrl}" alt="" />` : `<span>${emoji}</span>`;
  const width = BUBBLE_SIZE;
  const height = BUBBLE_SIZE + TAIL_HEIGHT;

  return L.divIcon({
    className: 'entry-pin',
    html: `<div class="entry-pin-bubble">${inner}</div>`,
    iconSize: [width, height],
    // Koordinata denk gelen nokta: normalde ucun altı-ortası; offset kadar kaydırılır
    iconAnchor: [width / 2 - offset.x, height - offset.y],
  });
}