import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const CalendarStep = ({ onNext, onBack, selectedDate, setSelectedDate, selectedTime, setSelectedTime }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 6, 1)); // Julio 2026

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

  // Determinar los horarios según si la fecha elegida es Día de Semana (18hs+) o Fin de Semana
  const getTimeSlotsForSelectedDate = () => {
    if (!selectedDate) return DATE_CONFIG.timeSlotsWeekends;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0 = Domingo, 6 = Sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return isWeekend ? DATE_CONFIG.timeSlotsWeekends : DATE_CONFIG.timeSlotsWeekdays;
  };

  const currentSlots = getTimeSlotsForSelectedDate();

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    // Limpiar horario al cambiar fecha para forzar una selección válida en los nuevos slots
    setSelectedTime('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="disney-card"
    >
      <div className="step-indicator">
        <div className="dot-step"></div>
        <div className="dot-step"></div>
        <div className="dot-step active"></div>
      </div>

      <span className="disney-title-accent">Segundo paso...</span>
      <h2 className="disney-title">Elegí la fecha 📅</h2>
      <p className="disney-subtitle">Los días con un corazón son los que tengo disponibles ✨</p>

      {/* Control del Mes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '0.6rem 1rem',
          border: '1.5px solid #ffe0e6'
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-pink)' }}
        >
          <ChevronLeft size={22} />
        </button>

        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={handleNextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-pink)' }}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Grid del Calendario */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '1.2rem' }}>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '4px 0',
              textAlign: 'center'
            }}
          >
            {day}
          </div>
        ))}

        {/* Celdas Vacías */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del Mes */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = formatDateString(dayNum);
          const isAvailable = DATE_CONFIG.availableDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <motion.div
              key={dateStr}
              whileTap={isAvailable ? { scale: 0.92 } : {}}
              onClick={() => isAvailable && handleDateClick(dateStr)}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.88rem',
                fontWeight: isSelected || isAvailable ? 700 : 500,
                cursor: isAvailable ? 'pointer' : 'default',
                background: isSelected
                  ? 'linear-gradient(135deg, #ff5c8a 0%, #ff7597 100%)'
                  : isAvailable
                    ? 'linear-gradient(135deg, #fff0f5 0%, #ffe4e8 100%)'
                    : 'rgba(0,0,0,0.02)',
                color: isSelected ? '#ffffff' : isAvailable ? 'var(--primary-pink)' : '#c0c0c0',
                border: isSelected
                  ? '2px solid var(--primary-pink)'
                  : isAvailable
                    ? '1.5px dashed var(--pastel-pink)'
                    : 'none',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(255, 92, 138, 0.35)'
                  : 'none',
                position: 'relative'
              }}
            >
              <span>{dayNum}</span>
              {isAvailable && !isSelected && (
                <Heart size={8} fill="var(--primary-pink)" color="var(--primary-pink)" style={{ position: 'absolute', bottom: '3px' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selector de Horarios Diferenciado (Día de semana vs Finde) */}
      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.4rem', textAlign: 'left' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
            Horario preferido: ⏰
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
            {currentSlots.map((slot) => {
              const isTimeSelected = selectedTime === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedTime(slot.id)}
                  style={{
                    padding: '0.55rem 0.2rem',
                    borderRadius: '12px',
                    border: isTimeSelected ? '2px solid var(--primary-pink)' : '1px solid #eee',
                    background: isTimeSelected ? 'var(--primary-pink)' : '#fff',
                    color: isTimeSelected ? '#fff' : 'var(--text-main)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div>{slot.label.split(' ')[0]}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>{slot.time}</div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Botones de Navegación */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onBack}
          className="btn-disney-secondary"
          style={{ width: '35%', marginTop: 0 }}
        >
          <ArrowLeft size={16} inline style={{ marginRight: '4px' }} />
          Atrás
        </button>

        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="btn-disney-primary"
          style={{
            width: '65%',
            opacity: !selectedDate || !selectedTime ? 0.5 : 1,
            cursor: !selectedDate || !selectedTime ? 'not-allowed' : 'pointer'
          }}
        >
          <span>Confirmar</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default CalendarStep;
