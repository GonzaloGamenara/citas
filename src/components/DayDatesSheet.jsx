import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, MapPin, ChevronRight } from 'lucide-react';
import { categoryEmoji } from '../data/categories';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/** "2026-07-15" → "15 de julio". Se parsea a mano para no correr la zona horaria. */
function prettyDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1] || ''}`;
}

/**
 * Las citas de un día.
 *
 * Existe porque un día puede tener más de una salida y el calendario abría
 * siempre la primera, sin forma de llegar a las otras ni de sumar una nueva
 * en esa fecha.
 */
const DayDatesSheet = ({ dateStr, dates, customCategories, onClose, onSelect, onAddAnother }) => {
  return createPortal(
    <AnimatePresence>
      {dateStr && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="day-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Citas del ${prettyDate(dateStr)}`}
          >
            <div className="day-sheet-header">
              <div>
                <span className="day-sheet-eyebrow">
                  {dates.length === 1 ? '1 cita' : `${dates.length} citas`}
                </span>
                <h3 className="day-sheet-title">{prettyDate(dateStr)}</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="day-sheet-list">
              {dates.map((item) => {
                const cats = item.categories || (item.category ? [item.category] : []);
                const locs = item.locations || (item.location ? [{ name: item.location }] : []);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="day-sheet-item"
                    onClick={() => onSelect(item)}
                  >
                    <span className="day-sheet-item-emoji">
                      {categoryEmoji(cats[0], customCategories)}
                    </span>

                    <span className="day-sheet-item-text">
                      <span className="day-sheet-item-title">{item.title}</span>
                      <span className="day-sheet-item-meta">
                        {item.time && (
                          <>
                            <Clock size={11} aria-hidden="true" /> {item.time}
                          </>
                        )}
                        {locs[0]?.name && (
                          <>
                            <MapPin size={11} aria-hidden="true" /> {locs[0].name}
                          </>
                        )}
                      </span>
                    </span>

                    <ChevronRight size={16} className="day-sheet-item-arrow" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="day-sheet-add-btn"
              onClick={() => onAddAnother(dateStr)}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Agregar otra cita este día</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DayDatesSheet;
