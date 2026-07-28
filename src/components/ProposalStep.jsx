import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ThermometerSnowflake, Mail } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const ProposalStep = ({ onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });

  // Esquivar manteniendo el botón NO 100% visible dentro del área de la tarjeta
  const dodgeNoButton = (e) => {
    if (e) {
      e.stopPropagation();
    }
    // Rangos de desplazamiento seguro que nunca desbordan la tarjeta en celulares
    const randomX = Math.floor((Math.random() - 0.5) * 160); // entre -80px y 80px
    const randomY = Math.floor((Math.random() - 0.5) * 120); // entre -60px y 60px

    setNoOffset({ x: randomX, y: randomY });
    setPhraseIndex((prev) => (prev + 1) % DATE_CONFIG.noButtonPhrases.length);
  };

  return (
    <div className="disney-card">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* ESTADO 1: CARTA / SOBRE ROMÁNTICO MODERNO 💌 */
          <motion.div
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            onClick={() => setIsOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="getwell-badge">
              <ThermometerSnowflake size={14} color="var(--primary-pink)" />
              <span>{DATE_CONFIG.getWellBadge}</span>
            </div>

            <h2 className="letter-recipient-title">
              {DATE_CONFIG.envelopeTitle}
            </h2>
            <p className="disney-subtitle">{DATE_CONFIG.envelopeSubtitle}</p>

            {/* Ilustración de Carta Sobria y Elegante */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="envelope-hero-wrapper"
            >
              <div className="seal-circle-gold">
                <Mail size={24} color="#ffffff" />
              </div>
            </motion.div>

            <motion.button
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="btn-disney-primary"
              style={{ marginTop: '0.6rem' }}
            >
              <span>Abrir carta</span>
              <Sparkles size={16} />
            </motion.button>
          </motion.div>
        ) : (
          /* ESTADO 2: PREGUNTA PRINCIPAL ✨ */
          <motion.div
            key="proposal-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="getwell-badge">
              <ThermometerSnowflake size={14} />
              <span>{DATE_CONFIG.getWellBadge}</span>
            </div>

            <h1 className="disney-title-serif">{DATE_CONFIG.proposalTitle}</h1>
            <p className="disney-subtitle">{DATE_CONFIG.proposalSubtitle}</p>

            {/* Corazón animado */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              style={{ margin: '0.6rem 0 1.2rem 0', display: 'inline-block' }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffd3e2 0%, #ff4770 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 22px rgba(255, 71, 112, 0.3)',
                  margin: '0 auto'
                }}
              >
                <Heart size={36} fill="#ffffff" color="#ffffff" className="pulse-heart" />
              </div>
            </motion.div>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', position: 'relative' }}>
              <button
                onClick={onAccept}
                className="btn-disney-primary"
              >
                <Heart fill="white" size={18} />
                <span>¡SÍ, DE UNA! 💕</span>
              </button>

              <motion.button
                onClick={dodgeNoButton}
                onMouseEnter={dodgeNoButton}
                onTouchStart={dodgeNoButton}
                className="btn-disney-secondary"
                animate={{
                  x: noOffset.x,
                  y: noOffset.y
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {DATE_CONFIG.noButtonPhrases[phraseIndex]}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalStep;
