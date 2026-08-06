import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addStyledTiles, createPinIcon } from '../utils/mapUtils';

// Emoji del pin según el tipo de plan de la cita
const CATEGORY_PINS = {
  cafe: '☕', postre: '🍰', vino: '🍷', cerveza: '🍺', tragos: '🍹',
  comida: '🍕', helado: '🍦', paseo: '🌳', mates: '🌅', cine: '🎬',
  teatro: '🎭', musica: '🎶', museo: '🏛️', arte: '🎨', secreto: '🪄'
};

// Coordenadas aproximadas para lugares conocidos en CABA
const KNOWN_SPOTS_COORDS = {
  'Palermo': [-34.5889, -58.4306],
  'San Telmo': [-34.6211, -58.3731],
  'Recoleta': [-34.5875, -58.3974],
  'Belgrano': [-34.5624, -58.4566],
  'Puerto Madero': [-34.6118, -58.3643],
  'Café Paul Gallery': [-34.5895, -58.4320],
  'Plaza Serrano': [-34.5885, -58.4300],
  'Showcase Belgrano': [-34.5567, -58.4550],
  'Cine Showcase Belgrano': [-34.5567, -58.4550],
  'Bar de Vinos San Telmo': [-34.6200, -58.3720]
};

// Los popups de Leaflet se arman con HTML crudo: escapamos el texto del usuario
const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);

// Dispersión determinística a partir del texto: sin esto los pines sin lat/lon
// se movían de lugar en cada re-render por usar Math.random()
const stableOffset = (seedText, salt) => {
  let hash = salt;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) % 100000;
  }
  return (hash / 100000) - 0.5;
};

const FullMapHuellas = ({ historyDates, onSelectDate }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Igual que en el picker: el padre recrea el callback en cada render
  const onSelectDateRef = useRef(onSelectDate);
  useEffect(() => {
    onSelectDateRef.current = onSelectDate;
  }, [onSelectDate]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centro inicial: CABA (-34.6037, -58.3816)
    const map = L.map(mapContainerRef.current, {
      center: [-34.6037, -58.3816],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    addStyledTiles(map);
    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    const bounds = L.latLngBounds();
    let hasMarkers = false;

    // Iterar por todas las citas registradas y colocar sus pines 📍
    (historyDates || []).forEach((item) => {
      const locs = item.locations && item.locations.length > 0
        ? item.locations
        : (item.location ? [{ name: item.location }] : [{ name: 'Buenos Aires' }]);

      locs.forEach((loc) => {
        // Manejar de forma ultra-segura si loc es objeto o string
        const locName = typeof loc === 'string' ? loc : (loc?.name || 'Lugar');
        let lat = typeof loc === 'object' ? loc?.lat : null;
        let lon = typeof loc === 'object' ? loc?.lon : null;

        // Si no tiene lat/lon guardado, buscar en los conocidos
        if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
          const seed = `${item.id || ''}-${locName}`;
          const matchedKey = Object.keys(KNOWN_SPOTS_COORDS).find((k) =>
            locName.toLowerCase().includes(k.toLowerCase())
          );
          if (matchedKey) {
            const base = KNOWN_SPOTS_COORDS[matchedKey];
            lat = base[0] + stableOffset(seed, 7) * 0.005;
            lon = base[1] + stableOffset(seed, 13) * 0.005;
          } else {
            // Dispersión suave en CABA
            lat = -34.6037 + stableOffset(seed, 7) * 0.03;
            lon = -58.3816 + stableOffset(seed, 13) * 0.03;
          }
        }

        const firstCat = (item.categories && item.categories[0]) || item.category;
        const marker = L.marker([lat, lon], {
          icon: createPinIcon(CATEGORY_PINS[firstCat] || '💖')
        }).addTo(map);
        bounds.extend([lat, lon]);
        hasMarkers = true;

        const popupEl = document.createElement('div');
        popupEl.className = 'map-popup-card';
        popupEl.innerHTML = `
          <span class="map-popup-place">📍 ${escapeHtml(locName)}</span>
          <h4 class="map-popup-title">${escapeHtml(item.title || 'Cita')}</h4>
          <div class="map-popup-date">📅 ${escapeHtml(item.date || '')}</div>
          ${item.notes ? `<p class="map-popup-notes">"${escapeHtml(item.notes)}"</p>` : ''}
          <button type="button" data-detail-btn class="map-popup-btn">Ver detalle de la cita</button>
        `;

        popupEl
          .querySelector('[data-detail-btn]')
          .addEventListener('click', () => onSelectDateRef.current?.(item));

        marker.bindPopup(popupEl);
      });
    });

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }

    // El contenedor entra con una animación de opacidad/desplazamiento
    const resizeTimer = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [historyDates]);

  return (
    <div className="full-map-huellas-wrapper">
      <div className="map-huellas-banner">
        <span>📍 Mapa de Nuestras Huellas en CABA ({historyDates?.length || 0} Citas)</span>
      </div>
      <div ref={mapContainerRef} className="map-huellas-leaflet" />
    </div>
  );
};

export default FullMapHuellas;
