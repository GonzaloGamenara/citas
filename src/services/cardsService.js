import { supabase } from './supabaseClient';

const TABLE = 'card_state';

/**
 * Estado compartido del mazo de Cartas: qué preguntas ya salieron y cuáles
 * quedaron marcadas como favoritas.
 *
 * Vive en Supabase por el mismo motivo que las citas y los pendientes: se
 * juega de a dos, muchas veces cada uno con su teléfono. Si el progreso fuera
 * local, Juli volvería a sacar cartas que ya jugaron juntos y las favoritas
 * de uno no las vería nunca el otro.
 *
 * Sólo se guarda fila para las cartas que tienen algo que contar: si una
 * carta deja de estar vista y de ser favorita, se borra la fila.
 */

/** { favorites: number[], seen: number[] } */
export async function fetchCardState() {
  const { data, error } = await supabase.from(TABLE).select('card_id, is_favorite, seen');
  if (error) throw error;

  const favorites = [];
  const seen = [];
  for (const row of data || []) {
    if (row.is_favorite) favorites.push(row.card_id);
    if (row.seen) seen.push(row.card_id);
  }
  return { favorites, seen };
}

/** Guarda el estado completo de UNA carta (el que llama ya conoce las dos banderas). */
export async function saveCardState(cardId, { favorite, seen }) {
  if (!favorite && !seen) {
    const { error } = await supabase.from(TABLE).delete().eq('card_id', cardId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert({ card_id: cardId, is_favorite: favorite, seen });
  if (error) throw error;
}

/**
 * "Empezar de nuevo" para un subconjunto del mazo (normalmente, la categoría
 * que se terminó). Las favoritas conservan la fila; el resto se borra.
 */
export async function clearSeenCards(cardIds) {
  if (!cardIds || cardIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from(TABLE)
    .delete()
    .in('card_id', cardIds)
    .eq('is_favorite', false);
  if (deleteError) throw deleteError;

  const { error: updateError } = await supabase
    .from(TABLE)
    .update({ seen: false })
    .in('card_id', cardIds)
    .eq('is_favorite', true);
  if (updateError) throw updateError;
}

/**
 * Realtime. En un DELETE, Postgres sólo manda la primary key, así que se
 * traduce a "esta carta no está vista ni es favorita".
 */
export function subscribeToCardState(onChange) {
  const channel = supabase
    .channel('card-state-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      if (payload.eventType === 'DELETE') {
        onChange({ cardId: payload.old.card_id, favorite: false, seen: false });
        return;
      }
      onChange({
        cardId: payload.new.card_id,
        favorite: Boolean(payload.new.is_favorite),
        seen: Boolean(payload.new.seen)
      });
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}
