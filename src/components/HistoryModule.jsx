import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, MapPin, Clock, Heart, Hourglass, Film, Drama, Map, List } from 'lucide-react';
import DateFormModal from './DateFormModal';
import DateDetailModal from './DateDetailModal';
import FullMapHuellas from './FullMapHuellas';

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

const HistoryModule = ({ historyDates, onSaveDate, onDeleteDate }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const formatDateString = (dayNum) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Métricas
  const totalDates = historyDates.length;

  const totalHours = historyDates.reduce((acc, curr) => {
    const durMatch = curr.duration ? curr.duration.match(/(\d+(\.\d+)?)/) : null;
    const hours = durMatch ? parseFloat(durMatch[1]) : 2;
    return acc + hours;
  }, 0);

  const totalLocationsCount = historyDates.reduce((acc, curr) => {
    const locs = curr.locations || (curr.location ? [{ name: curr.location }] : []);
    return acc + locs.length;
  }, 0);

  const handleDayClick = (dateStr) => {
    const datesOnDay = historyDates.filter((d) => d.date === dateStr);
    if (datesOnDay.length >= 1) {
      setSelectedDetailItem(datesOnDay[0]);
    } else {
      setEditingItem({ date: dateStr });
      setIsFormOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card history-container"
    >
      <div className="history-header">
        <div>
          <span className="disney-title-accent">Nuestras Citas</span>
          <h2 className="disney-title-serif" style={{ margin: 0 }}>Salidas & Recuerdos 📖</h2>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="btn-add-date"
        >
          <Plus size={16} />
          <span>Agregar Cita</span>
        </button>
      </div>

      {/* Toggle Vista Lista / Mapa de Huellas */}
      <div className="view-mode-toggle-bar">
        <button
          className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          <List size={14} />
          <span>Calendario & Lista</span>
        </button>
        <button
          className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => setViewMode('map')}
        >
          <Map size={14} />
          <span>Mapa de Huellas 📍</span>
        </button>
      </div>

      {viewMode === 'map' ? (
        <FullMapHuellas
          historyDates={historyDates}
          onSelectDate={(item) => setSelectedDetailItem(item)}
        />
      ) : (
        <>
          {/* Métricas / Stats Badges */}
          <div className="stats-badges-container">
            <div className="stat-badge-card">
              <div className="stat-icon-wrapper pink">
                <Heart size={16} fill="var(--primary-pink)" color="var(--primary-pink)" />
              </div>
              <div>
                <div className="stat-number">{totalDates}</div>
                <div className="stat-label">Citas Juntos</div>
              </div>
            </div>

            <div className="stat-badge-card">
              <div className="stat-icon-wrapper orange">
                <Hourglass size={16} color="#f97316" />
              </div>
              <div>
                <div className="stat-number">~{Math.round(totalHours)} hs</div>
                <div className="stat-label">Compartidas</div>
              </div>
            </div>

            <div className="stat-badge-card">
              <div className="stat-icon-wrapper gold">
                <MapPin size={16} color="#d97706" />
              </div>
              <div>
                <div className="stat-number">{totalLocationsCount}</div>
                <div className="stat-label">Lugares Visitados</div>
              </div>
            </div>
          </div>

          {/* Control de Mes */}
          <div className="month-control-bar">
            <button onClick={handlePrevMonth} className="month-nav-btn">
              <ChevronLeft size={20} />
            </button>
            <h3 className="month-display-name">
              {monthNames[month]} {year}
            </h3>
            <button onClick={handleNextMonth} className="month-nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Grid del Calendario */}
          <div className="calendar-grid-container">
            {daysOfWeek.map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateString(dayNum);
              const datesOnDay = historyDates.filter((d) => d.date === dateStr);
              const hasDate = datesOnDay.length > 0;

              const firstCat = hasDate
                ? (datesOnDay[0].categories ? datesOnDay[0].categories[0] : datesOnDay[0].category)
                : null;

              return (
                <motion.div
                  key={dateStr}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleDayClick(dateStr)}
                  className={`calendar-day-cell ${hasDate ? 'has-date' : ''}`}
                >
                  <span className="day-number">{dayNum}</span>
                  {hasDate && (
                    <div className="day-date-badge">
                      <span>{CATEGORIES_MAP[firstCat]?.emoji || '💖'}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Lista de Citas */}
          <div className="history-list-section">
            <h4 className="history-section-subtitle">
              Citas Registradas ({historyDates.length})
            </h4>

            {historyDates.length === 0 ? (
              <div className="empty-history-state">
                <span className="empty-emoji">💌</span>
                <p>Aún no hay citas guardadas en la agenda.</p>
                <button
                  className="btn-disney-primary"
                  style={{ marginTop: '0.6rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    setEditingItem(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <span>Registrar la primera cita</span>
                </button>
              </div>
            ) : (
              <div className="history-cards-stack">
                {[...historyDates]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item) => {
                    const cats = item.categories || (item.category ? [item.category] : ['cafe']);
                    const locs = item.locations || (item.location ? [{ name: item.location }] : []);
                    const media = item.mediaItems || [];

                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDetailItem(item)}
                        className="history-card-item"
                      >
                        <div className="history-card-emoji-box">
                          {CATEGORIES_MAP[cats[0]]?.emoji || '💖'}
                        </div>

                        <div className="history-card-content">
                          <div className="history-card-top-row">
                            <h4 className="history-card-title">{item.title}</h4>
                          </div>

                          <div className="history-card-cats-row">
                            {cats.map((cId) => {
                              const catObj = CATEGORIES_MAP[cId] || { name: cId, emoji: '💖' };
                              return (
                                <span key={cId} className="mini-cat-chip">
                                  {catObj.emoji} {catObj.name}
                                </span>
                              );
                            })}
                          </div>

                          <div className="history-card-meta">
                            <span className="meta-tag">
                              <Calendar size={12} /> {item.date}
                            </span>
                            {locs.length > 0 && (
                              <span className="meta-tag">
                                <MapPin size={12} /> {locs.map((l) => l.name).join(', ')}
                              </span>
                            )}
                            {item.duration && (
                              <span className="meta-tag">
                                <Clock size={12} /> {item.duration}
                              </span>
                            )}
                            {media.length > 0 && (
                              <span className="meta-tag media-tag-highlight">
                                {media[0].type === 'movie' ? <Film size={12} /> : <Drama size={12} />} {media[0].title}
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="history-card-notes-snippet">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Form */}
      <DateFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={onSaveDate}
        initialData={editingItem}
      />

      {/* Modal Detalle */}
      <DateDetailModal
        dateItem={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onEdit={(item) => {
          setSelectedDetailItem(null);
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onDelete={onDeleteDate}
      />
    </motion.div>
  );
};

export default HistoryModule;
