/**
 * Quién está usando este teléfono.
 *
 * La app no tiene login (son dos personas), pero sí necesita saber quién es
 * quién para dos cosas: firmar lo que cada uno agrega y, sobre todo, avisarle
 * al OTRO cuando aparece algo nuevo. Sin esto, las notificaciones le llegarían
 * a quien acaba de escribir.
 *
 * Se elige una vez y queda guardado en el dispositivo: es una preferencia del
 * teléfono, no un dato de la pareja, así que no va a Supabase.
 */

export const IDENTITY_STORAGE_KEY = 'citas_user_v1';

export const PEOPLE = [
  { id: 'gonza', name: 'Gonza', emoji: '🧉' },
  { id: 'juli', name: 'Juli', emoji: '🌷' }
];

const VALID_IDS = PEOPLE.map((p) => p.id);

/** 'gonza' | 'juli' | null si todavía no eligió nadie en este dispositivo. */
export function loadIdentity() {
  try {
    const saved = localStorage.getItem(IDENTITY_STORAGE_KEY);
    return VALID_IDS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveIdentity(id) {
  if (!VALID_IDS.includes(id)) return;
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, id);
  } catch (e) {
    console.error('No se pudo guardar quién está usando la app:', e);
  }
}

export function clearIdentity() {
  try {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  } catch {
    /* si no se puede borrar, se vuelve a preguntar igual al reinstalar */
  }
}

/** El otro: a quién hay que avisarle cuando este usuario agrega algo. */
export function partnerOf(id) {
  return VALID_IDS.includes(id) ? VALID_IDS.find((other) => other !== id) : null;
}

export function personName(id) {
  return PEOPLE.find((p) => p.id === id)?.name || '';
}
