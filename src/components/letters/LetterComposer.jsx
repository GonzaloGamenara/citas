import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Send, Mail } from 'lucide-react';
import LetterPaper from './LetterPaper';
import { personName, partnerOf } from '../../utils/identity';

const DRAFT_KEY = 'citas_letter_draft_v1';

function loadDraft() {
  try {
    return localStorage.getItem(DRAFT_KEY) || '';
  } catch {
    return '';
  }
}

function saveDraft(text) {
  try {
    if (text) localStorage.setItem(DRAFT_KEY, text);
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* borrador es una comodidad, no algo crítico */
  }
}

/**
 * Se escribe directamente sobre la hoja, con la misma letra con la que le va
 * a llegar. "Ver cómo se abre" reproduce la animación completa sin mandar
 * nada; "Enviar" pide una confirmación antes.
 */
const LetterComposer = ({ identity, onClose, onSend, onPreview }) => {
  const from = identity;
  const to = partnerOf(identity);
  const toName = personName(to);
  const [body, setBody] = useState(loadDraft);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState('writing'); // writing | sending | sent | error
  const textareaRef = useRef(null);

  useEffect(() => saveDraft(body), [body]);

  // El textarea crece con el texto: la hoja se alarga como una carta de verdad
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const hasText = body.trim().length > 0;

  const handleSend = async () => {
    setStatus('sending');
    try {
      await onSend({ from, to, body });
      saveDraft('');
      setStatus('sent');
      setTimeout(onClose, 2200);
    } catch (e) {
      console.error('Error enviando la carta:', e);
      setStatus('error');
      setConfirming(false);
    }
  };

  return createPortal(
    <motion.div
      className="letter-overlay letter-composer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Escribir una carta para ${toName}`}
    >
      <div className="composer-topbar">
        <button type="button" className="letter-close-btn letter-close-inline" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="composer-heading">
          <span className="composer-heading-label">Carta para</span>
          <span className="composer-heading-name">{toName}</span>
        </div>
        <span className="composer-topbar-spacer" />
      </div>


      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.div
            key="sent"
            className="composer-sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.span
              className="composer-sent-icon"
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: [0, -8, -140], rotate: [0, -6, 8], opacity: [1, 1, 0] }}
              transition={{ duration: 1.8, times: [0, 0.3, 1], ease: 'easeIn' }}
            >
              <Mail size={44} />
            </motion.span>
            <p className="composer-sent-title">Carta enviada</p>
            <p className="composer-sent-sub">
              A {toName} le llega el aviso y la abre cuando entra a la app.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="paper"
            className="letter-scroll composer-scroll"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ duration: 0.35 }}
          >
            <LetterPaper from={from} className="letter-paper-read letter-paper-editable">
              <textarea
                ref={textareaRef}
                className="letter-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Escribile a ${toName}…`}
                aria-label="Texto de la carta"
                autoFocus
                rows={8}
              />
            </LetterPaper>
            <p className="composer-tip">Dejá una línea en blanco entre párrafos.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== 'sent' && (
        <div className="composer-actions">
          {status === 'error' && <p className="composer-error">No se pudo enviar. Revisá la conexión y probá de nuevo.</p>}
          <AnimatePresence mode="wait">
            {confirming ? (
              <motion.div
                key="confirm"
                className="composer-confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p>¿Se la mandamos a {toName}? Le llega un aviso al celular.</p>
                <div className="composer-actions-row">
                  <button
                    type="button"
                    className="letter-btn letter-btn-ghost"
                    onClick={() => setConfirming(false)}
                    disabled={status === 'sending'}
                  >
                    Todavía no
                  </button>
                  <button
                    type="button"
                    className="letter-btn letter-btn-primary"
                    onClick={handleSend}
                    disabled={status === 'sending'}
                  >
                    <Send size={16} /> {status === 'sending' ? 'Enviando…' : 'Sí, enviarla'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="main" className="composer-actions-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button
                  type="button"
                  className="letter-btn letter-btn-ghost"
                  onClick={() => onPreview({ from, to, body })}
                  disabled={!hasText}
                >
                  <Eye size={16} /> Vista previa
                </button>
                <button
                  type="button"
                  className="letter-btn letter-btn-primary"
                  onClick={() => setConfirming(true)}
                  disabled={!hasText}
                >
                  <Send size={16} /> Enviar
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

export default LetterComposer;
