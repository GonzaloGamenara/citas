import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ThermometerSnowflake } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const ProposalStep = ({ onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [noPosition, setNoPosition] = useState(null);
  const cardRef = useRef(null);
  const yesBtnRef = useRef(null);

  // Esquivar manteniendo el botón NO 100% DENTRO de la tarjeta (Jamás desaparece de la pantalla)
  const dodgeNoButton = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const cardEl = cardRef.current;
    const cardWidth = cardEl ? cardEl.offsetWidth : 320;
    const cardHeight = cardEl ? cardEl.offsetHeight : 450;

    const btnWidth = 140;
    const btnHeight = 42;

    const minX = 14;
    const maxX = Math.max(minX, cardWidth - btnWidth - 14);

    const minY = 70;
    const maxY = Math.max(minY, cardHeight - btnHeight - 20);

    let newX = minX;
    let newY = minY;
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < 50) {
      attempts++;
      newX = Math.floor(minX + Math.random() * (maxX - minX));
      newY = Math.floor(minY + Math.random() * (maxY - minY));

      // Garantizar que no colisione con el botón SÍ
      if (yesBtnRef.current) {
        const yesRect = yesBtnRef.current.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const yesRelativeY = yesRect.top - cardRect.top;

        // Si está a más de 45px de distancia del botón SÍ en el eje Y, es válido
        if (Math.abs(newY - yesRelativeY) > 45) {
          isValid = true;
        }
      } else {
        isValid = true;
      }
    }

    setNoPosition({ x: newX, y: newY });
    setPhraseIndex((prev) => (prev + 1) % DATE_CONFIG.noButtonPhrases.length);
  };

  return (
    <div className="disney-card" ref={cardRef} style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* ESTADO 1: SOBRE TIPO CARTA REALISTA CON SELLO DORADO 💌 */
          <motion.div
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            onClick={() => setIsOpen(true)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '0.2rem 0'
            }}
          >
            <div>
              <div className="getwell-badge">
                <ThermometerSnowflake size={14} color="var(--primary-pink)" />
                <span>{DATE_CONFIG.getWellBadge}</span>
              </div>

              <h2 className="letter-recipient-title">
                {DATE_CONFIG.envelopeTitle}
              </h2>
              <p className="disney-subtitle">{DATE_CONFIG.envelopeSubtitle}</p>
            </div>

            {/* Ilustración 3D de Sobre Realista */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="envelope-real-card"
            >
              <div className="envelope-real-body">
                <div className="envelope-flap-top"></div>
                <div className="envelope-pocket-left"></div>
                <div className="envelope-pocket-right"></div>
                <div className="envelope-wax-stamp">
                  <Heart size={20} fill="#ffffff" color="#ffffff" className="pulse-heart" />
                </div>
              </div>
            </motion.div>

            <motion.button
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="btn-disney-primary"
              style={{ marginTop: '0.6rem', width: '100%' }}
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <div>
              <div className="getwell-badge">
                <ThermometerSnowflake size={14} />
                <span>{DATE_CONFIG.getWellBadge}</span>
              </div>

              <h1 className="disney-title-serif">{DATE_CONFIG.proposalTitle}</h1>
              <p className="disney-subtitle">{DATE_CONFIG.proposalSubtitle}</p>
            </div>

            {/* Corazón animado */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              style={{ margin: '0.4rem 0', display: 'inline-block' }}
            >
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffd3e2 0%, #ff4770 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 18px rgba(255, 71, 112, 0.28)',
                  margin: '0 auto'
                }}
              >
                <Heart size={34} fill="#ffffff" color="#ffffff" className="pulse-heart" />
              </div>
            </motion.div>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button
                ref={yesBtnRef}
                onClick={onAccept}
                className="btn-disney-primary"
              >
                <Heart fill="white" size={17} />
                <span>¡SÍ, DE UNA! 💕</span>
              </button>

              {!noPosition && (
                <button
                  onClick={dodgeNoButton}
                  onMouseEnter={dodgeNoButton}
                  onTouchStart={dodgeNoButton}
                  className="btn-disney-secondary"
                >
                  {DATE_CONFIG.noButtonPhrases[phraseIndex]}
                </button>
              )}
            </div>

            {/* Botón NO escapando STRICTAMENTE dentro del contenedor de la tarjeta (Jamás desaparece) */}
            {noPosition && (
              <motion.button
                onClick={dodgeNoButton}
                onMouseEnter={dodgeNoButton}
                onTouchStart={dodgeNoButton}
                className="btn-disney-secondary"
                initial={false}
                animate={{
                  position: 'absolute',
                  left: `${noPosition.x}px`,
                  top: `${noPosition.y}px`,
                  maxWidth: 'calc(100% - 28px)',
                  width: 'auto',
                  zIndex: 9999,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.18)'
                }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
              >
                {DATE_CONFIG.noButtonPhrases[phraseIndex]}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalStep;
