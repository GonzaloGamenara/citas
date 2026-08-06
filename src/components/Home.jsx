import React from 'react';
import { motion } from 'framer-motion';
import { CalendarHeart, Bookmark, Compass, ChevronRight } from 'lucide-react';

// Accesos rápidos a las otras 3 secciones: cada una con un ícono + una línea
// que explica qué hay adentro, sin vueltas.
const SECTIONS = [
  {
    tab: 'history',
    icon: CalendarHeart,
    title: 'Citas',
    description: 'Lo que ya vivimos, con fecha, lugar y notas.'
  },
  {
    tab: 'wishlist',
    icon: Bookmark,
    title: 'Pendientes',
    description: 'Lo que quedó anotado para hacer en algún momento.'
  },
  {
    tab: 'caba',
    icon: Compass,
    title: 'CABA',
    description: 'Ideas para cuando no sabemos qué hacer.'
  }
];

/**
 * Reemplaza temporalmente a DailyCheckin como pantalla de entrada. El
 * check-in de ánimo (DailyCheckin.jsx) queda desactivado pero sin borrar,
 * por si se retoma más adelante.
 */
const Home = ({ onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card home-container"
    >
      <span className="disney-title-accent">Para Juli</span>
      <h2 className="disney-title-serif">Sí, hice una app para esto</h2>

      <p className="home-intro">
        No hacía falta, pero bueno. Acá vamos guardando las citas, lo que queda
        pendiente y algunas ideas para Buenos Aires — la mayoría, seguramente,
        nunca las hagamos, pero ahí van a estar.
      </p>
      <p className="home-intro home-intro-tender">
        Lo armé porque quise que tuviéramos un lugar para todo esto.
      </p>

      <div className="home-sections-stack">
        {SECTIONS.map(({ tab, icon: Icon, title, description }) => (
          <button
            key={tab}
            type="button"
            className="home-section-card"
            onClick={() => onNavigate(tab)}
          >
            <span className="home-section-icon">
              <Icon size={18} />
            </span>
            <span className="home-section-text">
              <span className="home-section-title">{title}</span>
              <span className="home-section-desc">{description}</span>
            </span>
            <ChevronRight size={16} className="home-section-arrow" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Home;
