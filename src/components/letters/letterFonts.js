/**
 * Letras para elegir al escribir. Cada tipografía tiene su propio tamaño y
 * alto de línea (ver `.letter-font-*` en letters.css): a igual `font-size`,
 * Great Vibes se ve diminuta y Homemade Apple enorme.
 *
 * Todas se cargan desde Google Fonts en index.html.
 */
export const LETTER_FONTS = [
  { id: 'playwrite', label: 'Escolar', family: "'Playwrite AR'" },
  { id: 'dancing', label: 'Elegante', family: "'Dancing Script'" },
  { id: 'homemade', label: 'A mano', family: "'Homemade Apple'" },
  { id: 'vibes', label: 'Caligrafía', family: "'Great Vibes'" },
  { id: 'caveat', label: 'Informal', family: "'Caveat'" }
];

export const DEFAULT_LETTER_FONT = 'playwrite';

export function letterFontClass(fontId) {
  const known = LETTER_FONTS.some((f) => f.id === fontId);
  return `letter-font-${known ? fontId : DEFAULT_LETTER_FONT}`;
}
