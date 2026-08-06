import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Mensajes cortos y sinceros. Nada de jerga forzada ni signos de exclamación
// apilados — la idea es que suene a algo que alguien escribiría de verdad,
// no a una tarjeta de cumpleaños.
const DAILY_NOTES = [
  'Pensé en vos apenas me desperté. Que te vaya bien hoy.',
  'No hace falta que hoy sea un gran día. Con que estés bien, alcanza.',
  'Si se pone pesado, acordate de que después nos vemos y ya está.',
  'Sos de las pocas personas con las que puedo estar en silencio y sentirme acompañado.',
  'Ojalá tengas un rato para vos hoy, aunque sea corto.',
  'Cualquier cosa que necesites, avisame. Estoy.'
];

// Estados de ánimo reales, no antojos disfrazados de emoción.
const MOODS = [
  { id: 'bien', emoji: '🙂', label: 'Bien', response: 'Me alegra.' },
  { id: 'contenta', emoji: '😄', label: 'Contenta', response: 'Se nota. Me gusta.' },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila', response: 'Perfecto así.' },
  { id: 'cansada', emoji: '😴', label: 'Cansada', response: 'Descansá, no hay apuro.' },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa', response: 'Estoy acá si necesitás algo.' },
  { id: 'bajon', emoji: '😔', label: 'Con bajón', response: 'Te mando un abrazo. Avisame si querés hablar.' },
  { id: 'estresada', emoji: '😤', label: 'Estresada', response: 'Respirá. Ya va a pasar.' },
  { id: 'enamorada', emoji: '🥰', label: 'Enamorada', response: 'Yo también.' }
];

/**
 * `todayMood` / `onSelectMood` vienen de App.jsx: el ánimo del día vive en
 * Supabase (una fila por día), no en estado local — así si Juli lo marca
 * desde su teléfono, Gonza lo ve aparecer solo en el suyo.
 */
const DailyCheckin = ({ todayMood, onSelectMood }) => {
  // Selección automática única en cada recarga de la web (F5)
  const note = useMemo(() => DAILY_NOTES[Math.floor(Math.random() * DAILY_NOTES.length)], []);

  const handleSelectMood = (mood) => {
    onSelectMood(mood);
    confetti({
      particleCount: 24,
      spread: 50,
      origin: { y: 0.65 },
      colors: ['#ff4770', '#ffb3ba', '#ffd700']
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card daily-single-focus-container"
    >
      <span className="disney-title-accent">Para Juli</span>
      <h2 className="disney-title-serif">Un mensaje para hoy</h2>

      <div className="single-message-box">
        <p className="single-message-quote">"{note}"</p>
      </div>

      <div className="mood-section">
        <h3 className="mood-question">¿Cómo te sentís hoy?</h3>
        <span className="mood-hint">Tocá el que mejor te represente</span>

        <div className="mood-emoji-grid">
          {MOODS.map((m) => {
            const isSelected = todayMood?.id === m.id;
            return (
              <motion.button
                key={m.id}
                type="button"
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => handleSelectMood(m)}
                className={`mood-emoji-btn ${isSelected ? 'selected' : ''}`}
                title={m.label}
                aria-label={m.label}
                aria-pressed={isSelected}
              >
                <span className="mood-emoji-glyph">{m.emoji}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {todayMood && (
            <motion.div
              key={todayMood.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="mood-response-card"
            >
              <span className="mood-response-emoji">{todayMood.emoji}</span>
              <span className="mood-response-text">
                {MOODS.find((m) => m.id === todayMood.id)?.response || 'Anotado.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DailyCheckin;
