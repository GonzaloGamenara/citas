/**
 * Reasigna la categoría de cada carta de "Desconectados" y reescribe
 * src/data/cardsData.js.
 *
 * Antes esto era un clasificador por palabras clave. Fallaba seguido (la
 * carta "¿Qué creencias se les imponen a los/as niños/as...?" caía en
 * "recuerdos" sólo por la palabra "niño") y dejaba el 58% del mazo en una
 * sola categoría, lo que hacía inútil cualquier filtro. Ahora el criterio es
 * una tabla curada a mano: aburrida de mantener, pero correcta.
 *
 * El eje no es sólo el tema: es el tono. Cuando dos personas se sientan con
 * el mazo, lo que eligen es qué tan hondo quieren ir esta noche.
 *
 * Uso: node scripts/categorize-cards.mjs
 */
import fs from 'fs';
import { DESCONECTADOS_CARDS } from '../src/data/cardsData.js';

const CATEGORIES = [
  { id: 'todas', label: 'Todas', emoji: '✨', description: 'El mazo completo, sin filtrar.' },
  { id: 'livianas', label: 'Livianas', emoji: '🎈', description: 'Para arrancar: gustos, recuerdos y preguntas de juego.' },
  { id: 'pareja', label: 'Nosotros', emoji: '💖', description: 'Vínculos, amor, amistad y sexualidad.' },
  { id: 'profundo', label: 'Profundas', emoji: '🌙', description: 'Miedos, heridas y lo que cuesta decir en voz alta.' },
  { id: 'debates', label: 'Debates', emoji: '💡', description: 'Frases hechas, mandatos y temas para discutir.' }
];

/** id de carta → categoría. Toda carta tiene que estar acá (se valida abajo). */
const CURATED = {
  livianas: [
    1, 2, 3, 5, 6, 10, 11, 12, 14, 18, 20, 21, 23, 24, 27, 28, 29, 31, 33, 42,
    46, 48, 51, 52, 53, 54, 55, 57, 58, 60, 61, 62, 63, 64, 65, 66, 69, 70, 71,
    72, 73, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 89, 90, 91, 92,
    93, 142, 152, 163, 171, 178
  ],
  pareja: [
    17, 22, 36, 49, 59, 74, 98, 99, 104, 107, 108, 109, 115, 125, 131, 137, 144,
    148, 149, 159, 166, 167, 168, 172, 173, 185, 186
  ],
  debates: [
    26, 39, 47, 56, 94, 96, 97, 100, 101, 102, 103, 105, 106, 111, 112, 113,
    114, 116, 118, 119, 121, 123, 124, 126, 128, 129, 132, 133, 134, 135, 136,
    138, 139
  ],
  profundo: [
    4, 7, 8, 9, 13, 15, 16, 19, 25, 30, 32, 34, 35, 37, 38, 40, 41, 43, 44, 45,
    50, 67, 68, 88, 95, 110, 117, 120, 122, 127, 130, 140, 141, 143, 145, 146,
    147, 150, 151, 153, 154, 155, 156, 157, 158, 160, 161, 162, 164, 165, 169,
    170, 174, 175, 176, 177, 179, 180, 181, 182, 183, 184, 187
  ]
};

const categoryById = new Map();
for (const [category, ids] of Object.entries(CURATED)) {
  for (const id of ids) {
    if (categoryById.has(id)) {
      throw new Error(`La carta ${id} está en dos categorías: ${categoryById.get(id)} y ${category}`);
    }
    categoryById.set(id, category);
  }
}

const missing = DESCONECTADOS_CARDS.filter((c) => !categoryById.has(c.id)).map((c) => c.id);
if (missing.length > 0) {
  throw new Error(`Cartas sin categoría asignada: ${missing.join(', ')}`);
}

const knownIds = new Set(DESCONECTADOS_CARDS.map((c) => c.id));
const extra = [...categoryById.keys()].filter((id) => !knownIds.has(id));
if (extra.length > 0) {
  throw new Error(`La tabla menciona cartas que no existen: ${extra.join(', ')}`);
}

// El campo "deck" era la constante "Desconectados" repetida 187 veces y no lo
// leía nadie: se va.
const updatedCards = DESCONECTADOS_CARDS.map((c) => ({
  id: c.id,
  category: categoryById.get(c.id),
  text: c.text
}));

const counts = {};
updatedCards.forEach((c) => {
  counts[c.category] = (counts[c.category] || 0) + 1;
});
console.log(`${updatedCards.length} cartas. Distribución:`, counts);

const outContent = `/**
 * Cartas del juego "Desconectados" (@enpalabrass).
 *
 * Archivo GENERADO: no editar a mano. Las categorías se asignan en
 * scripts/categorize-cards.mjs (tabla curada) y se regeneran con:
 *   node scripts/categorize-cards.mjs
 */

/**
 * El orden importa: va de lo más liviano a lo más hondo, que es el orden en
 * el que uno realmente elige cuando se sienta a jugar.
 */
export const CARD_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const DESCONECTADOS_CARDS = ${JSON.stringify(updatedCards, null, 2)};

/** Cuántas cartas tiene cada categoría, para no recontar en cada render. */
export const CARDS_BY_CATEGORY = CARD_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] =
    cat.id === 'todas'
      ? DESCONECTADOS_CARDS.length
      : DESCONECTADOS_CARDS.filter((c) => c.category === cat.id).length;
  return acc;
}, {});
`;

fs.writeFileSync('./src/data/cardsData.js', outContent, 'utf8');
console.log('Escrito src/data/cardsData.js');
