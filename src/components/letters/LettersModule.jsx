import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MailOpen, PenLine, Trash2, FlaskConical } from 'lucide-react';
import { personName, partnerOf } from '../../utils/identity';
import { lettersBackend } from '../../services/lettersService';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}


const LettersModule = ({ letters, identity, onWrite, onOpenLetter, onDeleteLetter }) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card letters-container"
    >
      <span className="disney-title-accent">Cartas</span>
      <h2 className="disney-title-serif">Para leer despacio</h2>

      {lettersBackend === 'local' && (
        <p className="letters-test-banner">
          <FlaskConical size={14} /> Modo prueba: estas cartas quedan sólo en esta compu y no le llegan a nadie.
        </p>
      )}

      <button type="button" className="btn-disney-primary letters-write-btn" onClick={onWrite}>
        <PenLine size={16} /> Escribirle a {personName(partnerOf(identity))}
      </button>


      {letters.length === 0 ? (
        <p className="letters-empty">Todavía no hay cartas. La primera siempre cuesta un poco más.</p>
      ) : (
        <ul className="letters-list">
          {letters.map((letter) => {
            const unread = !letter.openedAt;
            const isMine = letter.from === identity;
            const Icon = unread && !isMine ? Mail : MailOpen;
            const snippet = letter.body.replace(/\s+/g, ' ').slice(0, 70);
            return (
              <li key={letter.id} className="letters-item-row">
                <button
                  type="button"
                  className={`letters-item ${unread && !isMine ? 'is-unread' : ''}`}
                  onClick={() => onOpenLetter(letter)}
                >
                  <span className="letters-item-icon">
                    <Icon size={18} />
                  </span>
                  <span className="letters-item-text">
                    <span className="letters-item-meta">
                      De {personName(letter.from)} para {personName(letter.to)} · {formatDate(letter.createdAt)}
                    </span>
                    <span className="letters-item-snippet">
                      {snippet}
                      {letter.body.length > 70 ? '…' : ''}
                    </span>
                    {unread && (
                      <span className="letters-item-badge">{isMine ? 'Todavía no la abrió' : 'Sin abrir'}</span>
                    )}
                  </span>
                </button>
                {isMine && (
                  <button
                    type="button"
                    className="letters-delete-btn"
                    aria-label="Borrar carta"
                    onClick={() => {
                      if (window.confirm('¿Borrar esta carta? No se puede deshacer.')) onDeleteLetter(letter.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
};

export default LettersModule;
