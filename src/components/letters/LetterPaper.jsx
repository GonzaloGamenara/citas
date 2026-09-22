import React, { forwardRef } from 'react';
import { personName } from '../../utils/identity';
import { letterFontClass } from './letterFonts';

/** Párrafos separados por línea en blanco; los saltos simples se respetan con pre-wrap. */
export function splitParagraphs(body) {
  return (body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Borde "cortado a mano" del papel como máscara SVG estática. Antes era un
 * filtro feTurbulence: se veía igual pero se recalculaba píxel a píxel en la
 * CPU en cada copia de la hoja, y trababa la animación en el celular. La
 * máscara se rasteriza una vez y listo.
 */
function buildDeckleMask() {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const pts = [];
  const edge = (from, to, amp, axis) => {
    for (let i = 0; i <= 140; i++) {
      const t = i / 140;
      const x = from[0] + (to[0] - from[0]) * t;
      const y = from[1] + (to[1] - from[1]) * t;
      const j = (rand() - 0.5) * amp;
      pts.push(axis === 'y' ? [x, y + j] : [x + j, y]);
    }
  };
  // viewBox 0..1000 estirado a la hoja: los lados llevan más amplitud porque la hoja es angosta y alta
  edge([4, 3], [996, 3], 2.5, 'y');
  edge([996, 3], [996, 997], 9, 'x');
  edge([996, 997], [4, 997], 2.5, 'y');
  edge([4, 997], [4, 3], 9, 'x');
  const d = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'><polygon points='${d}' fill='black'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--paper-mask', buildDeckleMask());
}

/**
 * La hoja: papel crema de bordes irregulares, pliegues en tercios y tinta
 * azul en la letra elegida. `children` reemplaza al texto — el redactor lo
 * usa para poner el textarea directamente en la hoja.
 */
const LetterPaper = forwardRef(({ from, body, font, children, className = '', style }, ref) => (
  <div ref={ref} className={`letter-paper ${letterFontClass(font)} ${className}`} style={style}>
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

export default LetterPaper;
