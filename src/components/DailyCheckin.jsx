import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Banco de Notitas 100% Argentinas de Gonza para Juli
const ARGENTINE_NOTES = [
  "Che Juli, paso a dejarte esta notita para desearte un día re lindo. Si la rutina se pone pesada o te cansás en pilates/ensayos, acordate de que a la tarde sale mate o cafecito tranqui. ¡Te banco en todas! 💕",
  "Recordatorio express para hoy: sos una genia mal en todo lo que hacés (arte, teatro, lo que sea). Ojalá hoy disfrutes un ratito con linda música y cero rosca. ¡Que tengas un día tremendo! ✨",
  "Paso rápido a saludarte: ojalá hoy te cruces con cosas lindas, te salga un café espectacular y nos veamos prontito para tomar un vinito y charlar de todo. ¡Arriba hoy! 🥰",
  "Un cafecito caliente, buena música de fondo y paz para hoy. Si necesitás un mimo o cortar la tarde, me avisás y armamos algo rico de una. ☕🥐",
  "Che, sos mi persona favorita para ir al teatro, pasear al solcito o tomar un vinito en cualquier rincón. ¡Espero que tengas una jornada brillante hoy! 🎟️💖"
];

// Grilla de estados de ánimo: el emoji es el protagonista, el resto es soporte
const MOOD_EMOJIS = [
  { id: 'genial',    emoji: '🥰', label: 'Re bien',       response: '¡Esooo! A comerse el día. Que dure esa energía ✨' },
  { id: 'contenta',  emoji: '😄', label: 'Contenta',      response: '¡Qué lindo leer eso! Contame después qué te alegró 💛' },
  { id: 'tranqui',   emoji: '😌', label: 'Tranqui',       response: 'Modo calma activado. Día tranqui es día ganado 🍃' },
  { id: 'cansada',   emoji: '😴', label: 'Con sueño',     response: 'Fiaca total. Te mando un abrazo recargador ☕' },
  { id: 'ansiosa',   emoji: '😬', label: 'Ansiosa',       response: 'Respirá hondo, vamos de a poco. Estoy acá 🤍' },
  { id: 'bajon',     emoji: '🥲', label: 'Bajoneada',     response: 'Te abrazo fuerte. Si querés hablar, escribime cuando quieras 💗' },
  { id: 'creativa',  emoji: '🎭', label: 'Modo artista',  response: '¡Mucha merde hoy con el arte y los ensayos! 🎨' },
  { id: 'enamorada', emoji: '💘', label: 'Enamoradísima', response: 'Bueno, pará que me sonrojo. Yo también 🥰' },
  { id: 'antojo',    emoji: '☕', label: 'Con antojo',    response: 'Marcha merienda apenas se pueda. Te la re merecés 🥐' },
  { id: 'finde',     emoji: '🍷', label: 'Modo finde',    response: 'Ya falta menos. Voy pensando un lugar lindo 📍' },
  { id: 'energia',   emoji: '⚡', label: 'A full',        response: '¡Qué máquina! A aprovechar esa energía 🚀' },
  { id: 'rara',      emoji: '🌀', label: 'Media rara',    response: 'Días raros también existen. Pasa, y yo te acompaño 🫂' }
];

/**
 * `todayMood` / `onSelectMood` vienen de App.jsx: el ánimo del día vive en
 * Supabase (una fila por día), no en estado local — así si Juli lo marca
 * desde su teléfono, Gonza lo ve aparecer solo en el suyo.
 */
const DailyCheckin = ({ todayMood, onSelectMood }) => {
  // Selección automática única en cada recarga de la web (F5)
  const randomNote = useMemo(() => {
    const idx = Math.floor(Math.random() * ARGENTINE_NOTES.length);
    return ARGENTINE_NOTES[idx];
  }, []);

  const handleSelectMood = (mood) => {
    onSelectMood(mood);
    confetti({
      particleCount: 30,
      spread: 55,
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
      {/* Notita del día */}
      <span className="disney-title-accent">Para Juli 💌</span>
      <h2 className="disney-title-serif">Una notita para arrancar el día ✨</h2>

      <div className="single-message-box">
        <p className="single-message-quote">"{randomNote}"</p>
      </div>

      {/* Check-in de ánimo, solo emojis */}
      <div className="mood-section">
        <h3 className="mood-question">¿Cómo te sentís hoy?</h3>
        <span className="mood-hint">Tocá el emoji que mejor te represente</span>

        <div className="mood-emoji-grid">
          {MOOD_EMOJIS.map((m) => {
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
                {MOOD_EMOJIS.find((m) => m.id === todayMood.id)?.response || '¡Anotado! 💕'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DailyCheckin;
