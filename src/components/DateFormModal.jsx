import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Hourglass, Film, Drama, Plus, Check, Sparkles, Map } from 'lucide-react';
import { searchPlaces, searchMovies, searchTheatre } from '../services/apiService';
import InteractiveMapPicker from './InteractiveMapPicker';
import { getTodayLocalISO } from '../utils/dateUtils';

const ALL_CATEGORIES = [
  { id: 'cafe', name: 'Café', emoji: '☕' },
  { id: 'postre', name: 'Merienda / Postre', emoji: '🍰' },
  { id: 'vino', name: 'Vino / Copa', emoji: '🍷' },
  { id: 'cerveza', name: 'Cerveza / Bar', emoji: '🍺' },
  { id: 'tragos', name: 'Tragos / Cócteles', emoji: '🍹' },
  { id: 'comida', name: 'Almuerzo / Cena', emoji: '🍕' },
  { id: 'helado', name: 'Helado', emoji: '🍦' },
  { id: 'paseo', name: 'Paseo / Parque', emoji: '🌳' },
  { id: 'mates', name: 'Sunset / Mates', emoji: '🌅' },
  { id: 'cine', name: 'Cine / Película', emoji: '🎬' },
  { id: 'teatro', name: 'Teatro / Obra', emoji: '🎭' },
  { id: 'musica', name: 'Concierto / Música', emoji: '🎶' },
  { id: 'museo', name: 'Museo / Exposición', emoji: '🏛️' },
  { id: 'secreto', name: 'Plan Sorpresa', emoji: '🪄' }
];

const QUICK_ZONES = [
  { name: 'Palermo', emoji: '🏙️' },
  { name: 'San Telmo', emoji: '🎸' },
  { name: 'Recoleta', emoji: '🏛️' },
  { name: 'Belgrano', emoji: '🌳' },
  { name: 'Puerto Madero', emoji: '🌆' },
  { name: 'En casa', emoji: '🏠' },
  { name: 'Un café tranqui', emoji: '☕' },
  { name: 'Parque / Plaza', emoji: '🌲' },
  { name: 'En el cine', emoji: '🍿' },
  { name: 'Costanera', emoji: '🌊' }
];

// Acepta tanto strings sueltos como objetos { name, lat, lon } y siempre devuelve un objeto válido
const normalizeLocation = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') {
    const name = loc.trim();
    return name ? { name, fullAddress: name } : null;
  }
  const name = (loc.name || loc.fullAddress || '').trim();
  return name ? { ...loc, name } : null;
};

const DateFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayLocalISO());
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('2 hs');
  const [categories, setCategories] = useState(['cafe']);
  const [notes, setNotes] = useState('');

  // Multilocalización con autocompletado y Mapa Interactivo
  const [locations, setLocations] = useState([]);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Películas y Teatro adjuntos
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaQuery, setMediaQuery] = useState('');
  const [mediaType, setMediaType] = useState('movie'); // 'movie' | 'theatre'
  const [mediaSuggestions, setMediaSuggestions] = useState([]);

  // Cargar datos al editar
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDate(initialData.date || getTodayLocalISO());
      setTime(initialData.time || '19:00');
      setDuration(initialData.duration || '2 hs');
      setCategories(initialData.categories || (initialData.category ? [initialData.category] : ['cafe']));
      setNotes(initialData.notes || '');

      if (initialData.locations && Array.isArray(initialData.locations)) {
        // Normalizar: las citas viejas pueden traer strings sueltos en vez de objetos
        setLocations(initialData.locations.map(normalizeLocation).filter(Boolean));
      } else if (initialData.location) {
        setLocations([{ name: initialData.location, fullAddress: initialData.location }]);
      } else {
        setLocations([]);
      }

      setMediaItems(initialData.mediaItems || []);
    } else {
      setTitle('');
      setDate(getTodayLocalISO());
      setTime('19:00');
      setDuration('2 hs');
      setCategories(['cafe']);
      setNotes('');
      setLocations([]);
      setMediaItems([]);
      setShowMapPicker(false);
    }
  }, [initialData, isOpen]);

  // Autocompletado de Lugares
  useEffect(() => {
    if (!placeQuery || placeQuery.trim().length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchPlaces(placeQuery);
      setPlaceSuggestions(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [placeQuery]);

  // Autocompletado de Cine / Teatro
  useEffect(() => {
    if (!mediaQuery || mediaQuery.trim().length < 2) {
      setMediaSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      let results = [];
      if (mediaType === 'movie') {
        results = await searchMovies(mediaQuery);
      } else {
        results = await searchTheatre(mediaQuery);
      }
      setMediaSuggestions(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [mediaQuery, mediaType]);

  // El buscador de cine/teatro sólo tiene sentido si la cita incluye esa
  // categoría — antes aparecía siempre, sin importar si era una merienda.
  const showsCine = categories.includes('cine');
  const showsTeatro = categories.includes('teatro');
  const showMediaSearch = showsCine || showsTeatro;

  const toggleCategory = (catId) => {
    setCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Si sólo una de las dos categorías está seleccionada, el toggle "Película
  // / Teatro" arranca ya apuntando a la que corresponde.
  useEffect(() => {
    if (showsTeatro && !showsCine) setMediaType('theatre');
    else if (showsCine && !showsTeatro) setMediaType('movie');
  }, [showsCine, showsTeatro]);

  const addLocation = (locObj) => {
    const normalized = normalizeLocation(locObj);
    if (!normalized) return;

    // Updater funcional: el mapa interactivo puede disparar esto de forma asíncrona
    setLocations((prev) =>
      prev.some((l) => l.name.toLowerCase() === normalized.name.toLowerCase())
        ? prev
        : [...prev, normalized]
    );
    setPlaceQuery('');
    setPlaceSuggestions([]);
  };

  const removeLocation = (indexToRemove) => {
    setLocations((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const addCustomLocation = (customName) => {
    const val = customName || placeQuery.trim();
    if (!val) return;
    addLocation({ name: val, fullAddress: val });
  };

  const addMediaItem = (item) => {
    const itemTitle = (item?.title || '').trim();
    if (!itemTitle) return;

    const normalized = { ...item, title: itemTitle, id: item.id || `media-${Date.now()}` };
    setMediaItems((prev) =>
      prev.some((m) => (m.title || '').toLowerCase() === itemTitle.toLowerCase())
        ? prev
        : [...prev, normalized]
    );
    setMediaQuery('');
    setMediaSuggestions([]);
  };

  const addCustomMediaItem = () => {
    if (!mediaQuery.trim()) return;
    const titleVal = mediaQuery.trim();
    addMediaItem({
      id: `custom-m-${Date.now()}`,
      title: titleVal,
      genre: mediaType === 'movie' ? 'Película' : 'Obra de Teatro',
      type: mediaType,
      poster: ''
    });
  };

  const removeMediaItem = (idToRemove) => {
    setMediaItems((prev) => prev.filter((m) => m.id !== idToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;

    onSave({
      id: initialData?.id || Date.now().toString(),
      title,
      date,
      time,
      duration,
      categories,
      locations,
      mediaItems,
      notes
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        className="modal-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3 className="modal-title">
              {initialData?.id ? '✏️ Editar Cita' : '💖 Registrar Nueva Cita'}
            </h3>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Título */}
            <div className="form-group">
              <label className="form-label">Título de la Cita *</label>
              <input
                type="text"
                required
                placeholder="Ej: Merienda en Palermo y Noche de Pelis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Categorías Múltiples */}
            <div className="form-group">
              <label className="form-label">Tipos de Plan (Elegí uno o más) *</label>
              <div className="category-chips">
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat.id);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      className={`chip-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha y Hora */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label flex-align">
                  <Calendar size={14} /> Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label flex-align">
                  <Clock size={14} /> Horario
                </label>
                <input
                  type="text"
                  placeholder="Ej: 18:30 hs"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Duración */}
            <div className="form-group">
              <label className="form-label flex-align">
                <Hourglass size={14} /> Duración Estimada
              </label>
              <input
                type="text"
                placeholder="Ej: 3 horas"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="form-input"
              />
            </div>

            {/* UBICACIÓN DINÁMICA: MAPA + CHIPS RÁPIDOS + AUTOCOMPLETADO */}
            <div className="form-group" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <label className="form-label flex-align">
                  <MapPin size={14} /> Ubicaciones / Lugares Visitados
                </label>
                <button
                  type="button"
                  className="map-toggle-btn"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                >
                  <Map size={13} />
                  <span>{showMapPicker ? 'Cerrar Mapa' : '📍 Marcar en Mapa'}</span>
                </button>
              </div>

              {/* Mapa Interactivo Leaflet */}
              {showMapPicker && (
                <div style={{ marginBottom: '0.7rem' }}>
                  <InteractiveMapPicker
                    onSelectLocation={(loc) => {
                      addLocation(loc);
                    }}
                  />
                </div>
              )}

              {/* Chips Rápidos de Zonas Informales */}
              <div className="quick-zones-wrapper">
                <span className="quick-zones-label">Zonas / Opciones rápidas:</span>
                <div className="quick-zones-scroll">
                  {QUICK_ZONES.map((zone, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className="zone-chip"
                      onClick={() => addCustomLocation(`${zone.emoji} ${zone.name}`)}
                    >
                      <span>{zone.emoji}</span>
                      <span>{zone.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input con Búsqueda Libre y Autocompletado */}
              <div className="autocomplete-input-wrapper" style={{ marginTop: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Escribí un lugar o dirección informal..."
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomLocation();
                    }
                  }}
                  className="form-input"
                />
                {placeQuery && (
                  <button
                    type="button"
                    className="input-inline-btn"
                    onClick={() => addCustomLocation()}
                    title="Agregar lugar escrito"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Sugerencias de Autocompletado */}
              {placeSuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {placeSuggestions.map((item) => (
                    <div
                      key={item.id}
                      className="autocomplete-item"
                      onClick={() => addLocation(item)}
                    >
                      <MapPin size={14} className="icon-pink" />
                      <div>
                        <div className="item-title">{item.name}</div>
                        <div className="item-subtitle">{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón para agregar directamente lo que escribió */}
              {placeQuery && (
                <button
                  type="button"
                  className="custom-add-banner"
                  onClick={() => addCustomLocation()}
                >
                  <Plus size={14} />
                  <span>Agregar "<b>{placeQuery}</b>" como lugar</span>
                </button>
              )}

              {/* Lista de Ubicaciones Agregadas */}
              {locations.length > 0 && (
                <div className="added-items-list">
                  {locations.map((loc, idx) => (
                    <div key={idx} className="added-item-tag">
                      <MapPin size={12} />
                      <span className="tag-text">{loc.name}</span>
                      <button
                        type="button"
                        onClick={() => removeLocation(idx)}
                        className="remove-tag-btn"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUSCADOR DE CINE Y TEATRO — sólo si la cita es de esa categoría */}
            {showMediaSearch && (
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label className="form-label flex-align">
                    🎬 Buscador de Película u Obra de Teatro
                  </label>
                  {/* El toggle sólo hace falta si eligieron las dos categorías a la vez */}
                  {showsCine && showsTeatro && (
                    <div className="media-type-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${mediaType === 'movie' ? 'active' : ''}`}
                        onClick={() => setMediaType('movie')}
                      >
                        <Film size={12} /> Película
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${mediaType === 'theatre' ? 'active' : ''}`}
                        onClick={() => setMediaType('theatre')}
                      >
                        <Drama size={12} /> Teatro
                      </button>
                    </div>
                  )}
                </div>

                <div className="autocomplete-input-wrapper">
                  <input
                    type="text"
                    placeholder={mediaType === 'movie' ? 'Ej: Spiderman Brand New Day, Intensamente...' : 'Ej: Toc Toc, Obras de calle Corrientes...'}
                    value={mediaQuery}
                    onChange={(e) => setMediaQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomMediaItem();
                      }
                    }}
                    className="form-input"
                  />
                  {mediaQuery && (
                    <button
                      type="button"
                      className="input-inline-btn"
                      onClick={addCustomMediaItem}
                      title="Agregar película u obra manual"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {/* Sugerencias de Cine / Teatro */}
                {mediaSuggestions.length > 0 && (
                  <div className="autocomplete-dropdown media-dropdown">
                    {mediaSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="autocomplete-item media-item"
                        onClick={() => addMediaItem(item)}
                      >
                        {item.poster ? (
                          <img src={item.poster} alt={item.title} className="media-poster-thumb" />
                        ) : (
                          <div className="media-poster-placeholder">
                            {item.type === 'movie' ? <Film size={16} /> : <Drama size={16} />}
                          </div>
                        )}
                        <div>
                          <div className="item-title">{item.title}</div>
                          <div className="item-subtitle">
                            {item.genre} {item.year ? `• ${item.year}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón de Agregado Manual Siempre Disponible al Escribir */}
                {mediaQuery && (
                  <button
                    type="button"
                    className="custom-add-banner"
                    onClick={addCustomMediaItem}
                  >
                    <Plus size={14} />
                    <span>Agregar "<b>{mediaQuery}</b>" a la cita</span>
                  </button>
                )}

                {/* Tarjetas de Medios Adjuntos */}
                {mediaItems.length > 0 && (
                  <div className="added-media-stack">
                    {mediaItems.map((m) => (
                      <div key={m.id} className="added-media-card">
                        {m.poster ? (
                          <img src={m.poster} alt={m.title} className="media-card-poster" />
                        ) : (
                          <div className="media-card-icon-fallback">
                            {m.type === 'movie' ? <Film size={18} /> : <Drama size={18} />}
                          </div>
                        )}
                        <div className="media-card-info">
                          <span className="media-card-badge">{m.type === 'movie' ? '🎬 Película' : '🎭 Teatro'}</span>
                          <h5 className="media-card-title">{m.title}</h5>
                          {m.genre && <span className="media-card-sub">{m.genre}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaItem(m.id)}
                          className="remove-tag-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notas y Recuerdos */}
            <div className="form-group">
              <label className="form-label">Recuerdos y Detalles Especiales ✨</label>
              <textarea
                rows={3}
                placeholder="¿Qué momentos destacados vivieron? Alguna anécdota, frases graciosas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-disney-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-disney-primary">
                <span>Guardar Cita</span>
                <Sparkles size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DateFormModal;
