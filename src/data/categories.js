/**
 * Categorías de citas y pendientes.
 *
 * Antes esto vivía en tres lugares a la vez: `ALL_CATEGORIES` en
 * DateFormModal, `CATEGORIES_MAP` en HistoryModule y un `switch` en
 * WishlistModule que sólo conocía 7 de las 14 y devolvía ☕ para el resto
 * (elegir "Helado" en un pendiente te daba un café). Ahora hay una sola
 * lista y todos leen de acá.
 *
 * A las fijas se les suman las que la pareja crea desde la app, que viven en
 * Supabase para que las vean los dos.
 */

export const BUILTIN_CATEGORIES = [
  { id: 'cafe', name: 'Café', emoji: '☕' },
  { id: 'postre', name: 'Merienda / Postre', emoji: '🍰' },
  { id: 'vino', name: 'Vino / Copa', emoji: '🍷' },
  { id: 'cerveza', name: 'Cerveza / Bar', emoji: '🍺' },
  { id: 'tragos', name: 'Tragos / Cócteles', emoji: '🍹' },
  { id: 'comida', name: 'Almuerzo / Cena', emoji: '🍕' },
  { id: 'helado', name: 'Helado', emoji: '🍦' },
  { id: 'paseo', name: 'Paseo / Parque', emoji: '🌳' },
  { id: 'mates', name: 'Sunset / Mates', emoji: '🌅' },
  { id: 'cine', name: 'Cine / Película', emoji: '🎬' },
  { id: 'teatro', name: 'Teatro / Obra', emoji: '🎭' },
  { id: 'musica', name: 'Concierto / Música', emoji: '🎶' },
  { id: 'museo', name: 'Museo / Exposición', emoji: '🏛️' },
  { id: 'secreto', name: 'Plan Sorpresa', emoji: '🪄' }
];

const BUILTIN_IDS = new Set(BUILTIN_CATEGORIES.map((c) => c.id));

export function isBuiltinCategory(id) {
  return BUILTIN_IDS.has(id);
}

/** Las fijas primero y después las propias, en el orden en que las crearon. */
export function allCategories(custom = []) {
  return [...BUILTIN_CATEGORIES, ...custom];
}

export function findCategory(id, custom = []) {
  return allCategories(custom).find((c) => c.id === id) || null;
}

/** Emoji de una categoría. El 💖 es el comodín de "no la conozco". */
export function categoryEmoji(id, custom = []) {
  return findCategory(id, custom)?.emoji || '💖';
}

export function categoryName(id, custom = []) {
  return findCategory(id, custom)?.name || 'Otro';
}

/**
 * Id a partir del nombre: "Feria de diseño" → "custom-feria-de-diseno".
 * El prefijo evita que una categoría propia pise a una fija si alguien la
 * llama igual, y el sufijo numérico resuelve los choques entre propias.
 */
export function makeCategoryId(name, existing = []) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

  const base = `custom-${slug || 'cat'}`;
  const taken = new Set(existing.map((c) => c.id));
  if (!taken.has(base)) return base;

  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
