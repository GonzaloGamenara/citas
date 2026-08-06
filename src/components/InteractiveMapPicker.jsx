import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addStyledTiles, createPinIcon } from '../utils/mapUtils';

// Los popups de Leaflet se arman con HTML crudo: escapamos el texto de la API
const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);

const InteractiveMapPicker = ({ onSelectLocation }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // El padre pasa un callback nuevo en cada render; lo guardamos en un ref para que
  // el efecto pueda depender de [] y el mapa no se destruya/recree en cada tecla escrita.
  const onSelectLocationRef = useRef(onSelectLocation);
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Coordenadas por defecto (Buenos Aires: -34.6037, -58.3816)
    const initialLat = -34.6037;
    const initialLng = -58.3816;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    addStyledTiles(map);
    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // El mapa se monta dentro de un modal animado: recalcular tamaño al terminar la animación
    const resizeTimer = setTimeout(() => map.invalidateSize(), 250);

    // Click handler en el mapa para colocar el pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: createPinIcon('📍', 'active') }).addTo(map);
      }

      // Obtener nombre aproximado del punto tocado vía Reverse Geocoding
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
        if (res.ok) {
          const data = await res.json();
          // Nominatim puede devolver 200 con un error y sin display_name
          const parts = (data?.display_name || '').split(',').filter(Boolean);
          if (parts.length === 0) throw new Error('Sin display_name');

          const placeName = parts[0].trim() || 'Punto en el mapa';
          const areaName = parts.slice(1, 3).join(',').trim();

          markerRef.current
            .bindPopup(
              `<div class="map-popup-card"><h4 class="map-popup-title">📍 ${escapeHtml(placeName)}</h4>` +
                `<div class="map-popup-date">${escapeHtml(areaName)}</div></div>`
            )
            .openPopup();

          onSelectLocationRef.current({
            name: placeName,
            fullAddress: data.display_name,
            lat,
            lon: lng
          });
          return;
        }
      } catch (err) {
        console.error('Error en geocodificación inversa:', err);
      }

      // Fallback: si Nominatim falla o responde mal, guardamos las coordenadas crudas
      onSelectLocationRef.current({
        name: `Punto Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        fullAddress: `Coordenadas: ${lat}, ${lng}`,
        lat,
        lon: lng
      });
    });

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  return (
    <div className="interactive-map-wrapper">
      <div className="map-instruction-banner">
        <span>📍 Tocá cualquier punto del mapa para colocar la ubicación</span>
      </div>
      <div ref={mapContainerRef} className="map-leaflet-container" />
    </div>
  );
};

export default InteractiveMapPicker;
