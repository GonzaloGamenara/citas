import L from 'leaflet';

/**
 * Tiles de CartoDB "Positron": mapa minimalista en tonos claros que combina con
 * la paleta rosa de la app, en vez del OSM estándar (verde/amarillo saturado).
 * En Modo Vela se invierten por CSS (.candle-mode-active .leaflet-tile-pane).
 */
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
export const TILE_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

/** Agrega la base + las etiquetas al mapa con la estética de la app */
export function addStyledTiles(map) {
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 19,
    zIndex: 5,
    className: 'app-map-tiles'
  }).addTo(map);

  // Las etiquetas van en el mismo panel de tiles (con zIndex mayor) para que el
  // filtro de inversión del Modo Vela las afecte igual que al mapa base.
  L.tileLayer(TILE_LABELS_URL, {
    subdomains: 'abcd',
    maxZoom: 19,
    zIndex: 10,
    className: 'app-map-labels'
  }).addTo(map);
}

/**
 * Pin rosa con emoji, en lugar del marcador azul por defecto de Leaflet.
 */
export function createPinIcon(emoji = '💖', variant = 'default') {
  return L.divIcon({
    className: 'app-pin-icon-wrapper',
    html: `<div class="app-pin ${variant === 'active' ? 'app-pin-active' : ''}">
             <span class="app-pin-emoji">${emoji}</span>
           </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40]
  });
}
