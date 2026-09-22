import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, PenLine } from 'lucide-react';
import LetterPaper from './LetterPaper';
import { personName } from '../../utils/identity';

const EASE_PAPER = [0.45, 0.05, 0.25, 1];

/**
 * El sobre llega, se rompe el lacre, se abre la solapa, sale la carta doblada
 * en tres y se despliega (primero el tercio de arriba, después el de abajo),
 * como una carta de verdad.
 *
 * El despliegue se arma con tres copias de la hoja completa, cada una
 * recortada a su tercio con clip-path. Así funciona con cualquier largo de
 * texto sin tener que partirlo a mano: cada tercio gira sobre su pliegue.
 *
 * stage: envelope → opening → rising → unfolding → read
 */
const LetterOpening = ({
  letter,
  identity,
  preview = false,
  onClose,
  onOpened,
  onReply
}) => {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState('envelope');
  const [paperHeight, setPaperHeight] = useState(0);
  const overlayRef = useRef(null);
  const letterWrapRef = useRef(null);
  const measureRef = useRef(null);

  const fromName = personName(letter.from);
  const toName = personName(letter.to);

  // Alto real de la hoja (depende del texto y de que cargue la tipografía)
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setPaperHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [letter.body]);

  // Sin scroll de fondo mientras la carta está abierta
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleEnvelopeTap = () => {
    if (stage !== 'envelope') return;
    onOpened?.(letter);
    setStage(reduceMotion ? 'read' : 'opening');
  };

  // Solapa + lacre, y después sale la carta
  useEffect(() => {
    if (stage !== 'opening') return;
    const t = setTimeout(() => setStage('rising'), 1150);
    return () => clearTimeout(t);
  }, [stage]);

  // Red de seguridad: si algún onAnimationComplete no llega (pestaña en
  // segundo plano, animación interrumpida), la carta igual termina abierta.
  useEffect(() => {
    const next = { rising: 'unfolding', unfolding: 'read' }[stage];
    if (!next) return;
    const t = setTimeout(() => setStage((s) => (s === stage ? next : s)), stage === 'rising' ? 1400 : 2400);
    return () => clearTimeout(t);
  }, [stage]);

  // Cartas más altas que la pantalla: se centra el tercio del medio (lo que
  // se ve doblado) para que el despliegue ocurra a la vista.
  useLayoutEffect(() => {
    if (stage !== 'rising') return;
    const overlay = overlayRef.current;
    const wrap = letterWrapRef.current;
    if (!overlay || !wrap) return;
    const target = wrap.offsetTop + paperHeight / 2 - overlay.clientHeight / 2;
    overlay.scrollTop = Math.max(0, target);
  }, [stage, paperHeight]);

  // Ya desplegada: volver al principio de la carta para leerla desde arriba
  useEffect(() => {
    if (stage !== 'read') return;
    const t = setTimeout(() => overlayRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 250);
    return () => clearTimeout(t);
  }, [stage]);

  const showFolding = stage === 'rising' || stage === 'unfolding';
  const envelopeVisible = stage === 'envelope' || stage === 'opening';

  return createPortal(
    <motion.div
      className={`letter-overlay stage-${stage}`}
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Carta de ${fromName} para ${toName}`}
    >
      <button type="button" className="letter-close-btn" onClick={onClose} aria-label="Cerrar carta">
        <X size={18} />
      </button>

      {preview && <span className="letter-preview-tag">Vista previa · así le va a llegar</span>}

      {/* Copia invisible sólo para medir el alto de la hoja */}
      <div className="letter-measure" aria-hidden="true">
        <LetterPaper ref={measureRef} from={letter.from} body={letter.body} />
      </div>

      {/* ---------------- Sobre ---------------- */}
      <AnimatePresence>
        {envelopeVisible && (
          <motion.div
            key="envelope"
            className="letter-envelope-stage"
            initial={{ y: -40, opacity: 0, rotate: -6 }}
            animate={{ y: 0, opacity: 1, rotate: -2 }}
            exit={{ y: 220, opacity: 0, rotate: 4, transition: { duration: 0.45, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <button
              type="button"
              className={`envelope ${stage === 'opening' ? 'is-open' : ''}`}
              onClick={handleEnvelopeTap}
              aria-label={`Abrir la carta de ${fromName}`}
            >
              <span className="envelope-back" />
              <span className="envelope-peek" />
              <span className="envelope-pocket" />
              <span className="envelope-flap" />
              <span className="envelope-address">
                <span className="envelope-address-label">Para</span>
                {toName}
              </span>
              <span className="wax-seal">
                <span className="wax-seal-letter">{fromName.charAt(0)}</span>
              </span>
            </button>

            <AnimatePresence>
              {stage === 'envelope' && (
                <motion.p
                  key="hint"
                  className="envelope-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {preview
                    ? `Así le llega a ${toName}. Tocá el sobre para abrirla.`
                    : `Tenés una carta de ${fromName}. Tocá el sobre para abrirla.`}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Carta ---------------- */}
      {(showFolding || stage === 'read') && (
        <div className="letter-scroll">
          <div className="letter-wrap" ref={letterWrapRef} style={{ minHeight: paperHeight || undefined }}>
            {showFolding && paperHeight > 0 && (
              <motion.div
                className="letter-fold"
                style={{ height: paperHeight }}
                initial={{ y: 70, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                onAnimationComplete={() => setStage((s) => (s === 'rising' ? 'unfolding' : s))}
              >
                {/* Tercio del medio: no se mueve */}
                <div className="fold-panel">
                  <div className="fold-face fold-face-mid">
                    <LetterPaper from={letter.from} body={letter.body} />
                  </div>
                </div>

                {/* Tercio de abajo: se dobló primero, se despliega segundo */}
                <motion.div
                  className="fold-panel"
                  style={{ transformOrigin: '50% 66.667%' }}
                  initial={{ rotateX: 180, z: 1 }}
                  animate={stage === 'unfolding' ? { rotateX: 0, z: 0 } : undefined}
                  transition={{ duration: 1, ease: EASE_PAPER, delay: 0.75 }}
                  onAnimationComplete={() => setStage((s) => (s === 'unfolding' ? 'read' : s))}
                >
                  <div className="fold-face fold-face-bottom">
                    <LetterPaper from={letter.from} body={letter.body} />
                    <motion.span
                      className="fold-shade"
                      initial={{ opacity: 0.45 }}
                      animate={stage === 'unfolding' ? { opacity: 0 } : undefined}
                      transition={{ duration: 1, delay: 0.75 }}
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
                  animate={stage === 'unfolding' ? { rotateX: 0, z: 0 } : undefined}
                  transition={{ duration: 1, ease: EASE_PAPER }}
                >
                  <div className="fold-face fold-face-top">
                    <LetterPaper from={letter.from} body={letter.body} />
                    <motion.span
                      className="fold-shade"
                      initial={{ opacity: 0.45 }}
                      animate={stage === 'unfolding' ? { opacity: 0 } : undefined}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="fold-face fold-face-top fold-face-back">
                    <div className="letter-paper letter-paper-blank" />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {stage === 'read' && <LetterPaper from={letter.from} body={letter.body} className="letter-paper-read" />}
          </div>

          <AnimatePresence>
            {stage === 'read' && (
              <motion.div
                className="letter-read-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>,
    document.body
  );
};

export default LetterOpening;
