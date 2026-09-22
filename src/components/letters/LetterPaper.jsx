import React, { forwardRef } from 'react';
import { personName } from '../../utils/identity';

/** Párrafos separados por línea en blanco; los saltos simples se respetan con pre-wrap. */
export function splitParagraphs(body) {
  return (body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * La hoja: papel crema de bordes irregulares, pliegues en tercios y tinta
 * azul en cursiva escolar argentina (Playwrite AR). `children` reemplaza al
 * texto — el redactor lo usa para poner el textarea directamente en la hoja.
 */
const LetterPaper = forwardRef(({ from, body, children, className = '', style }, ref) => (
  <div ref={ref} className={`letter-paper ${className}`} style={style}>
    <span className="letter-monogram" aria-hidden="true">
      {personName(from).charAt(0) || '♡'}
    </span>
    {children ?? (
      <div className="letter-body">
        {splitParagraphs(body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    )}
  </div>
));

LetterPaper.displayName = 'LetterPaper';

/** Filtro SVG del borde "cortado a mano" del papel. Se monta una sola vez en App. */
export const PaperFilters = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <filter id="letter-deckle" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

export default LetterPaper;
