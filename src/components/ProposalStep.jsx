import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Mail, ThermometerSnowflake } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const ProposalStep = ({ onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [noPosition, setNoPosition] = useState(null);
  const yesBtnRef = useRef(null);

  const dodgeNoButton = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const padding = 18;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const btnWidth = Math.min(180, screenWidth * 0.6);
    const btnHeight = 44;

    let yesBox = null;
    if (yesBtnRef.current) {
      yesBox = yesBtnRef.current.getBoundingClientRect();
    }

    let newX = padding;
    let newY = padding;
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < 60) {
      attempts++;
      newX = Math.floor(padding + Math.random() * (screenWidth - btnWidth - padding * 2));
      newY = Math.floor(padding + Math.random() * (screenHeight - btnHeight - padding * 2));

      if (yesBox) {
        const buffer = 45;
        const overlapsX = newX + btnWidth >= yesBox.left - buffer && newX <= yesBox.right + buffer;
        const overlapsY = newY + btnHeight >= yesBox.top - buffer && newY <= yesBox.bottom + buffer;

        if (!(overlapsX && overlapsY)) {
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
    <div className="disney-card">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* ESTADO 1: SOBRE CERRADO CARTA 💌 */
          <motion.div
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            onClick={() => setIsOpen(true)}
            style={{ cursor: 'pointer', padding: '0.2rem 0' }}
          >
            <div className="getwell-badge">
              <ThermometerSnowflake size={14} color="var(--primary-pink)" />
              <span>{DATE_CONFIG.getWellBadge}</span>
            </div>

            <h2 className="letter-recipient-title">
              {DATE_CONFIG.envelopeTitle}
            </h2>
            <p className="disney-subtitle">{DATE_CONFIG.envelopeSubtitle}</p>

            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="envelope-wrapper"
            >
              <div className="envelope-body">
                <Mail size={42} color="#ffffff" />
              </div>
              <div className="envelope-flap"></div>
              <div className="seal-heart">
                <Heart size={18} fill="var(--primary-pink)" color="var(--primary-pink)" className="pulse-heart" />
              </div>
            </motion.div>

            <motion.button
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="btn-disney-primary"
              style={{ marginTop: '1rem', width: '100%' }}
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

            {/* Ilustración Corazón */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              style={{ margin: '0.2rem 0 1rem 0', display: 'inline-block' }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', position: 'relative' }}>
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

            {/* Botón NO escapando */}
            {noPosition && (
              <motion.button
                onClick={dodgeNoButton}
                onMouseEnter={dodgeNoButton}
                onTouchStart={dodgeNoButton}
                className="btn-disney-secondary"
                initial={false}
                animate={{
                  position: 'fixed',
                  left: `${noPosition.x}px`,
                  top: `${noPosition.y}px`,
                  maxWidth: 'calc(100vw - 32px)',
                  width: 'auto',
                  zIndex: 99999,
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
