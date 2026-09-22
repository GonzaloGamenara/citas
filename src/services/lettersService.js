import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'letters';

/**
 * Dos backends con la misma interfaz:
 *
 * - 'supabase': el real (producción). Tabla `letters` + realtime. El push
 *   no lo manda el cliente: el INSERT dispara el mismo trigger que citas y
 *   pendientes (`notify_partner_on_insert` → Edge Function `notify-partner`).
 * - 'local': sólo en `npm run dev`. Guarda las cartas en localStorage y
 *   sincroniza entre pestañas con el evento `storage`, así se puede probar
 *   escribir en una pestaña (`?soy=gonza`) y recibir en otra (`?soy=juli`)
 *   sin que ninguna carta de prueba le llegue a Juli de verdad.
 *
 * Para probar en dev contra Supabase: VITE_LETTERS_BACKEND=supabase en .env.
 */
export const lettersBackend =
  isSupabaseConfigured && (import.meta.env.PROD || import.meta.env.VITE_LETTERS_BACKEND === 'supabase')
    ? 'supabase'
    : 'local';

function fromRow(row) {
  return {
    id: row.id,
    from: row.from_person,
    to: row.to_person,
    body: row.body,
    font: row.font || null,
    createdAt: row.created_at,
    openedAt: row.opened_at
  };
}

function toRow(letter) {
  return {
    id: letter.id,
    from_person: letter.from,
    to_person: letter.to,
    body: letter.body,
    font: letter.font,
    created_at: letter.createdAt,
    opened_at: letter.openedAt
  };
}

const byNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

// ---------------------------------------------------------------------------
// Backend local (dev)
// ---------------------------------------------------------------------------
const LOCAL_KEY = 'citas_dev_letters_v1';

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(letters) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(letters));
}

const local = {
  async fetchAll() {
    return readLocal().sort(byNewest);
  },
  async insert(letter) {
    writeLocal([letter, ...readLocal()]);
  },
  async markOpened(id, openedAt) {
    writeLocal(readLocal().map((l) => (l.id === id ? { ...l, openedAt } : l)));
  },
  async remove(id) {
    writeLocal(readLocal().filter((l) => l.id !== id));
  },
  subscribe({ onInsert, onUpdate, onDelete }) {
    // `storage` sólo se dispara en las OTRAS pestañas: justo lo que simula el otro celular
    const handler = (e) => {
      if (e.key !== LOCAL_KEY) return;
      const before = new Map((JSON.parse(e.oldValue || '[]') || []).map((l) => [l.id, l]));
      const after = JSON.parse(e.newValue || '[]') || [];
      for (const l of after) {
        const prev = before.get(l.id);
        if (!prev) onInsert(l);
        else if (JSON.stringify(prev) !== JSON.stringify(l)) onUpdate(l);
        before.delete(l.id);
      }
      for (const id of before.keys()) onDelete(id);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
};

// ---------------------------------------------------------------------------
// Backend Supabase
// ---------------------------------------------------------------------------
const remote = {
  async fetchAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  },
  async insert(letter) {
    let { error } = await supabase.from(TABLE).insert(toRow(letter));
    // PGRST204: la columna `font` todavía no existe (falta correr el ALTER de
    // supabase-letters.sql). La carta se manda igual, con la letra por defecto.
    if (error?.code === 'PGRST204') {
      const { font, ...withoutFont } = toRow(letter);
      ({ error } = await supabase.from(TABLE).insert(withoutFont));
    }
    if (error) throw error;
  },
  async markOpened(id, openedAt) {
    const { error } = await supabase.from(TABLE).update({ opened_at: openedAt }).eq('id', id).is('opened_at', null);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
  subscribe({ onInsert, onUpdate, onDelete }) {
    const channel = supabase
      .channel('letters-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        if (payload.eventType === 'INSERT') onInsert(fromRow(payload.new));
        else if (payload.eventType === 'UPDATE') onUpdate(fromRow(payload.new));
        else if (payload.eventType === 'DELETE') onDelete(payload.old.id);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};

const backend = lettersBackend === 'supabase' ? remote : local;

export const fetchLetters = () => backend.fetchAll();
export const markLetterOpened = (id) => backend.markOpened(id, new Date().toISOString());
export const deleteLetter = (id) => backend.remove(id);
export const subscribeToLetters = (handlers) => backend.subscribe(handlers);

/** Crea la carta (en producción el trigger de la base le manda el push al otro). Devuelve la carta creada. */
export async function sendLetter({ from, to, body, font }) {
  const letter = {
    id: `letter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from,
    to,
    body: body.trim(),
    font: font || null,
    createdAt: new Date().toISOString(),
    openedAt: null
  };
  await backend.insert(letter);
  return letter;
}
