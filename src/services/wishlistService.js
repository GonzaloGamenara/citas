import { supabase } from './supabaseClient';

const TABLE = 'wishlist';

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location || '',
    category: row.category || 'cafe',
    emoji: row.emoji || '📌',
    notes: row.notes || ''
  };
}

function toRow(item) {
  return {
    id: item.id,
    title: item.title,
    location: item.location || null,
    category: item.category || null,
    emoji: item.emoji || null,
    notes: item.notes || null
  };
}

export async function fetchWishlist() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertWish(item) {
  const { error } = await supabase.from(TABLE).upsert(toRow(item));
  if (error) throw error;
}

export async function deleteWish(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/** Sólo para la migración inicial. */
export async function insertManyWishes(items) {
  if (!items || items.length === 0) return;
  const { error } = await supabase.from(TABLE).insert(items.map(toRow));
  if (error) throw error;
}

export function subscribeToWishlist({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('wishlist-changes')
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
