import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Hourglass, Film, Drama, Edit2, Trash2, ExternalLink } from 'lucide-react';

const CATEGORIES_MAP = {
  cafe: { name: 'Café', emoji: '☕' },
  postre: { name: 'Postre', emoji: '🍰' },
  vino: { name: 'Vino', emoji: '🍷' },
  cerveza: { name: 'Cerveza', emoji: '🍺' },
  tragos: { name: 'Tragos', emoji: '🍹' },
  comida: { name: 'Cena/Almuerzo', emoji: '🍕' },
  helado: { name: 'Helado', emoji: '🍦' },
  paseo: { name: 'Paseo', emoji: '🌳' },
  mates: { name: 'Mates', emoji: '🌅' },
  cine: { name: 'Cine', emoji: '🎬' },
  teatro: { name: 'Teatro', emoji: '🎭' },
  musica: { name: 'Música', emoji: '🎶' },
  museo: { name: 'Museo', emoji: '🏛️' },
  secreto: { name: 'Sorpresa', emoji: '🪄' }
};

const DateDetailModal = ({ dateItem, onClose, onEdit, onDelete }) => {
  // Obtener categorías seleccionadas
  const selectedCategories = dateItem?.categories || (dateItem?.category ? [dateItem.category] : ['cafe']);

  // Obtener ubicaciones (pueden venir como strings sueltos en citas viejas)
  const rawLocations = dateItem?.locations || (dateItem?.location ? [dateItem.location] : []);
  const locationsList = rawLocations
    .map((loc) => (typeof loc === 'string' ? { name: loc, fullAddress: loc } : loc))
    .filter((loc) => loc && loc.name);

  // Obtener medios
  const mediaList = dateItem?.mediaItems || [];

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {dateItem && (
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
            <h3 className="modal-title">{dateItem.title}</h3>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="detail-ticket-wrapper">
            {/* Categorías Múltiples */}
            <div className="detail-categories-row">
              {selectedCategories.map((catId) => {
                const cat = CATEGORIES_MAP[catId] || { name: catId, emoji: '💖' };
                return (
                  <span key={catId} className="detail-cat-chip">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                );
              })}
            </div>

            {/* Grid de Información */}
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <Calendar size={15} className="detail-icon" />
                <div>
                  <span className="detail-label">FECHA</span>
                  <div className="detail-value text-capitalize">
                    {getFormattedDate(dateItem.date)}
                  </div>
                </div>
              </div>

              {dateItem.time && (
                <div className="detail-info-item">
                  <Clock size={15} className="detail-icon" />
                  <div>
                    <span className="detail-label">HORARIO</span>
                    <div className="detail-value">{dateItem.time}</div>
                  </div>
                </div>
              )}

              {dateItem.duration && (
                <div className="detail-info-item">
                  <Hourglass size={15} className="detail-icon" />
                  <div>
                    <span className="detail-label">DURACIÓN</span>
                    <div className="detail-value">{dateItem.duration}</div>
                  </div>
                </div>
              )}

              {/* Lista de Ubicaciones con enlace a Google Maps */}
              {locationsList.length > 0 && (
                <div className="detail-info-item full-width">
                  <MapPin size={15} className="detail-icon" />
                  <div style={{ flex: 1 }}>
                    <span className="detail-label">UBICACIONES ({locationsList.length})</span>
                    <div className="locations-links-stack">
                      {locationsList.map((loc, idx) => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.fullAddress || loc.name)}`;
                        return (
                          <a
                            key={idx}
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-link-item"
                          >
                            <span>📍 {loc.name}</span>
                            <ExternalLink size={12} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Películas y Teatro Adjuntos */}
            {mediaList.length > 0 && (
              <div className="detail-media-section">
                <span className="detail-notes-title">Cine & Teatro Visto ✨</span>
                <div className="detail-media-grid">
                  {mediaList.map((media) => (
                    <div key={media.id} className="detail-media-card">
                      {media.poster ? (
                        <img src={media.poster} alt={media.title} className="detail-media-poster" />
                      ) : (
                        <div className="detail-media-placeholder">
                          {media.type === 'movie' ? <Film size={20} /> : <Drama size={20} />}
                        </div>
                      )}
                      <div className="detail-media-meta">
                        <span className="media-type-tag">
                          {media.type === 'movie' ? '🎬 Película' : '🎭 Teatro'}
                        </span>
                        <div className="media-title">{media.title}</div>
                        {media.genre && <div className="media-sub">{media.genre}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recuerdos y Notas */}
            {dateItem.notes && (
              <div className="detail-notes-box">
                <span className="detail-notes-title">Recuerdos y momentos especiales ✨</span>
                <p className="detail-notes-content">"{dateItem.notes}"</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-disney-secondary"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => {
                if (window.confirm('¿Seguro que querés eliminar este recuerdo?')) {
                  onDelete(dateItem.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>

            <button
              type="button"
              className="btn-disney-primary"
              onClick={() => {
                onClose();
                onEdit(dateItem);
              }}
            >
              <Edit2 size={16} />
              <span>Editar Cita</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DateDetailModal;
