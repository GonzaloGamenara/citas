import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, PenLine } from 'lucide-react';
import LetterPaper from './LetterPaper';
import { personName } from '../../utils/identity';
import { useThemeColor } from '../../utils/themeColor';

const EASE_PAPER = [0.45, 0.05, 0.25, 1];
const EASE_OUT = [0.22, 1, 0.36, 1];

// Duración de cada etapa. Las etapas avanzan con timers (no con
// onAnimationComplete) para que la carta nunca quede trabada a mitad de camino.
const STAGE_MS = {
  opening: 900, // se rompe el lacre y se abre la solapa
  extracting: 850, // la carta sale del sobre
  presenting: 900, // el sobre se va y la carta viene al centro
  unfolding: 1800 // se despliega en tres
};
const NEXT_STAGE = { opening: 'extracting', extracting: 'presenting', presenting: 'unfolding', unfolding: 'read' };

/**
 * El sobre llega, se rompe el lacre, se abre la solapa, la carta doblada
 * sale del sobre, el sobre se va para abajo, la carta viene al centro y se
 * despliega (primero el tercio de arriba, después el de abajo).
 *
 * Todo pasa en una sola escena fija con tres capas: parte trasera del sobre
 * (fondo + solapa), la carta, y parte delantera (bolsillo + lacre). Así la
 * carta sale de adentro del sobre de verdad, sin cortes entre una cosa y otra.
 *
 * El despliegue usa tres copias de la hoja completa, cada una recortada a su
 * tercio con clip-path y girando sobre su pliegue: funciona con cualquier largo.
 */
const LetterOpening = ({ letter, identity, preview = false, onClose, onOpened, onReply }) => {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState('envelope');
  const [paperHeight, setPaperHeight] = useState(0);
  const overlayRef = useRef(null);
  const scrollRef = useRef(null);
  const measureRef = useRef(null);

  useThemeColor('#3f2418');

  const fromName = personName(letter.from);
  const toName = personName(letter.to);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setPaperHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [letter.body, letter.font]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const next = NEXT_STAGE[stage];
    if (!next) return;
    const t = setTimeout(() => setStage(next), STAGE_MS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  const handleEnvelopeTap = () => {
    if (stage !== 'envelope' || !paperHeight) return;
    onOpened?.(letter);
    setStage(reduceMotion ? 'read' : 'opening');
  };

  // Medidas de la escena (px). El sobre y la hoja tienen anchos distintos,
  // así que adentro del sobre la carta va achicada y crece al salir.
  const geo = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const envW = Math.min(vw - 48, 360);
    const envH = envW * 0.64;
    const letterW = Math.min(vw - 32, 440);
    const folded = Math.max(paperHeight / 3, 1);
    const scaleIn = Math.min((envW * 0.86) / letterW, (envH * 0.8) / folded);
    const visible = folded * scaleIn;
    return {
      envW,
      envH,
      scaleIn,
      yIn: -envH / 2 + envH * 0.08 + visible / 2,
      yOut: -envH / 2 - visible / 2 + envH * 0.3
    };
  }, [paperHeight]);

  const envelopeGone = stage === 'presenting' || stage === 'unfolding';
  const envelopeMotion = envelopeGone
    ? { y: geo.envH * 1.1 + 160, opacity: 0, rotate: 3 }
    : { y: 0, opacity: 1, rotate: -2 };
  const envelopeTransition = envelopeGone
    ? { duration: 0.7, ease: 'easeIn' }
    : { type: 'spring', stiffness: 120, damping: 15 };

  const letterMotion = {
    envelope: { y: geo.yIn, scale: geo.scaleIn, rotate: -2, opacity: 0 },
    opening: { y: geo.yIn, scale: geo.scaleIn, rotate: -2, opacity: 1 },
    extracting: { y: geo.yOut, scale: geo.scaleIn, rotate: -2, opacity: 1 },
    presenting: { y: 0, scale: 1, rotate: 0, opacity: 1 },
    unfolding: { y: 0, scale: 1, rotate: 0, opacity: 1 }
  }[stage];
  const letterTransition = {
    envelope: { duration: 0 },
    // aparece recién cuando la solapa ya pasó la vertical: antes está tapada
    opening: { opacity: { delay: 0.5, duration: 0.12 } },
    extracting: { duration: 0.8, ease: EASE_OUT },
    presenting: { duration: 0.85, ease: [0.4, 0, 0.2, 1] },
    unfolding: { duration: 0 }
  }[stage];

  const unfolding = stage === 'unfolding';

  // Al pasar a lectura, la hoja plana tiene que quedar exactamente donde
  // estaba la desplegada (centrada) y recién después subir al principio.
  useLayoutEffect(() => {
    if (stage !== 'read') return;
    const overlay = overlayRef.current;
    const scroll = scrollRef.current;
    if (!overlay || !scroll) return;
    const ch = overlay.clientHeight;
    const padTop = parseFloat(getComputedStyle(scroll).getPropertyValue('--pad-top')) || 64;
    const top = Math.max(padTop, ch / 2 - paperHeight / 2);
    scroll.style.paddingTop = `${top}px`;
    overlay.scrollTop = Math.max(0, top + paperHeight / 2 - ch / 2);
    if (overlay.scrollTop > 0) {
      const t = setTimeout(() => overlay.scrollTo({ top: 0, behavior: 'smooth' }), 350);
      return () => clearTimeout(t);
    }
  }, [stage, paperHeight]);

  const paper = <LetterPaper from={letter.from} body={letter.body} font={letter.font} />;

  return createPortal(
    <motion.div
      className={`letter-overlay stage-${stage}`}
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Carta de ${fromName} para ${toName}`}
    >
      <button type="button" className="letter-close-btn" onClick={onClose} aria-label="Cerrar carta">
        <X size={18} />
      </button>

      {preview && <span className="letter-preview-tag">Vista previa · así le va a llegar</span>}

      <div className="letter-measure" aria-hidden="true">
        <LetterPaper ref={measureRef} from={letter.from} body={letter.body} font={letter.font} />
      </div>

      {stage !== 'read' && (
        <div className="letter-scene">
          {/* Capa 1: fondo del sobre + solapa (queda detrás de la carta) */}
          <motion.div
            className="env-layer"
            style={{ width: geo.envW, height: geo.envH }}
            initial={{ y: -40, opacity: 0, rotate: -6 }}
            animate={envelopeMotion}
            transition={envelopeTransition}
          >
            <div className={`envelope-rear ${stage !== 'envelope' ? 'is-open' : ''}`}>
              <span className="envelope-back" />
              <span className="envelope-flap" />
            </div>
          </motion.div>

          {/* Capa 2: la carta doblada en tres */}
          {paperHeight > 0 && (
            <motion.div
              className="letter-holder"
              style={{ height: paperHeight }}
              initial={letterMotion}
              animate={letterMotion}
              transition={letterTransition}
            >
              <div className="letter-fold">
                <div className="fold-panel">
                  <div className="fold-face fold-face-mid">{paper}</div>
                </div>

                {/* Tercio de abajo: se dobló primero, se despliega segundo */}
                <motion.div
                  className="fold-panel"
                  style={{ transformOrigin: '50% 66.667%' }}
                  initial={{ rotateX: 180, z: 1 }}
                  animate={unfolding ? { rotateX: 0, z: 0 } : { rotateX: 180, z: 1 }}
                  transition={{ duration: 1, ease: EASE_PAPER, delay: unfolding ? 0.7 : 0 }}
                >
                  <div className="fold-face fold-face-bottom">
                    {paper}
                    <motion.span
                      className="fold-shade"
                      animate={{ opacity: unfolding ? 0 : 0.4 }}
                      transition={{ duration: 1, delay: unfolding ? 0.7 : 0 }}
                    />
                  </div>
                  <div className="fold-face fold-face-bottom fold-face-back">
                    <div className="letter-paper letter-paper-blank" />
                  </div>
                </motion.div>

                {/* Tercio de arriba: queda por fuera, se despliega primero */}
                <motion.div
                  className="fold-panel"
                  style={{ transformOrigin: '50% 33.333%' }}
                  initial={{ rotateX: -180, z: 2 }}
                  animate={unfolding ? { rotateX: 0, z: 0 } : { rotateX: -180, z: 2 }}
                  transition={{ duration: 1, ease: EASE_PAPER }}
                >
                  <div className="fold-face fold-face-top">
                    {paper}
                    <motion.span
                      className="fold-shade"
                      animate={{ opacity: unfolding ? 0 : 0.4 }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="fold-face fold-face-top fold-face-back">
                    <div className="letter-paper letter-paper-blank" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Capa 3: bolsillo, destinatario y lacre (delante de la carta) */}
          <motion.div
            className="env-layer env-layer-front"
            style={{ width: geo.envW, height: geo.envH }}
            initial={{ y: -40, opacity: 0, rotate: -6 }}
            animate={envelopeMotion}
            transition={envelopeTransition}
          >
            <button
              type="button"
              className={`envelope-front ${stage !== 'envelope' ? 'is-open' : ''}`}
              onClick={handleEnvelopeTap}
              aria-label={`Abrir la carta de ${fromName}`}
            >
              <span className="envelope-pocket" />
              <span className="envelope-address">
                <span className="envelope-address-label">Para</span>
                {toName}
              </span>
              <span className="wax-seal">
                <span className="wax-seal-letter">{fromName.charAt(0)}</span>
              </span>
            </button>
          </motion.div>

          <AnimatePresence>
            {stage === 'envelope' && (
              <motion.p
                key="hint"
                className="envelope-hint"
                style={{ y: geo.envH / 2 + 56 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: 0.5 }}
              >
                {preview
                  ? `Así le llega a ${toName}. Tocá el sobre para abrirla.`
                  : `Tenés una carta de ${fromName}. Tocá el sobre para abrirla.`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {stage === 'read' && (
        <div className="letter-scroll letter-scroll-read" ref={scrollRef}>
          <LetterPaper from={letter.from} body={letter.body} font={letter.font} className="letter-paper-read" />
          <motion.div
            className="letter-read-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {!preview && onReply && identity === letter.to && (
              <button type="button" className="letter-btn letter-btn-primary" onClick={() => onReply(letter)}>
                <PenLine size={16} /> Responderle a {fromName}
              </button>
            )}
            <button type="button" className="letter-btn letter-btn-ghost" onClick={onClose}>
              {preview ? 'Volver a escribir' : 'Guardarla'}
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>,
    document.body
  );
};

export default LetterOpening;
