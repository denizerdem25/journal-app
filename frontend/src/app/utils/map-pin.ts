import * as L from 'leaflet';

/** Haritada emoji şeklinde pin oluşturur (varsayılan: 📍) */
export function createPinIcon(emoji = '📍'): L.DivIcon {
  return L.divIcon({
    className: 'journal-pin',
    html: `<span>${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // pinin ucu: yatayda ortası, dikeyde en altı
  });
}