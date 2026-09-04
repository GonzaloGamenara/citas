import { supabase } from './supabaseClient';

const TABLE = 'custom_categories';

/**
 * Categorías que la pareja se inventa desde la app.
 *
 * Van a Supabase y no a localStorage porque una categoría que existe sólo en
 * un teléfono es peor que no tenerla: el otro vería el emoji comodín 💖 en
 * las citas que uno etiquetó.
 */

function fromRow(row) {
  return { id: row.id, name: row.name, emoji: row.emoji };
}

export async function fetchCustomCategories() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, emoji')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertCustomCategory(category) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: category.id, name: category.name, emoji: category.emoji });
  if (error) throw error;
}

export async function deleteCustomCategory(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToCustomCategories({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('custom-categories-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, (p) =>
      onInsert(fromRow(p.new))
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE }, (p) =>
      onUpdate(fromRow(p.new))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: TABLE }, (p) =>
      onDelete(p.old.id)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
