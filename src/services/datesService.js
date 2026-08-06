import { supabase } from './supabaseClient';

const TABLE = 'dates';

// DB (snake_case, media_items) <-> forma que usa el resto de la app (camelCase, mediaItems)
function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time || '',
    duration: row.duration || '',
    categories: row.categories || [],
    locations: row.locations || [],
    mediaItems: row.media_items || [],
    notes: row.notes || ''
  };
}

function toRow(item) {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    time: item.time || null,
    duration: item.duration || null,
    categories: item.categories || [],
    locations: item.locations || [],
    media_items: item.mediaItems || [],
    notes: item.notes || null
  };
}

export async function fetchDates() {
  const { data, error } = await supabase.from(TABLE).select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertDate(item) {
  const { error } = await supabase.from(TABLE).upsert(toRow(item));
  if (error) throw error;
}

export async function deleteDate(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/** Sólo para la migración inicial: inserta varias citas de una vez. */
export async function insertManyDates(items) {
  if (!items || items.length === 0) return;
  const { error } = await supabase.from(TABLE).insert(items.map(toRow));
  if (error) throw error;
}

/**
 * Suscripción en tiempo real: dispara cuando el otro teléfono agrega, edita
 * o borra una cita. Requiere que la tabla esté agregada a la publicación
 * `supabase_realtime` (ver scripts/supabase-schema.sql).
 */
export function subscribeToDates({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('dates-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, (payload) => {
      onInsert(fromRow(payload.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE }, (payload) => {
      onUpdate(fromRow(payload.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: TABLE }, (payload) => {
      onDelete(payload.old.id);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}
