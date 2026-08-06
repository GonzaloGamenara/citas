import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modo Vela: resplandor ambiental cálido + vela animada en la esquina.
 *
 * El resplandor va por detrás del contenido (z-index bajo) y la vela por
 * delante, como dos capas fijas independientes: antes la vela estaba anidada
 * dentro del contenedor del resplandor y quedaba tapada por la tarjeta.
 */
const CandleOverlay = ({ isCandleMode }) => {
  return (
    <AnimatePresence>
      {isCandleMode && (
        <React.Fragment key="candle">
          <motion.div
            className="candle-ambient-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          <motion.div
            className="candle-graphic-wrapper"
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <div className="candle-halo" />

            <div className="candle-flame">
              <span className="flame-core" />
            </div>

            <div className="candle-body">
              <span className="candle-wick" />
              <span className="candle-wax-melt" />
            </div>

            <div className="candle-light-pool" />
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default CandleOverlay;
