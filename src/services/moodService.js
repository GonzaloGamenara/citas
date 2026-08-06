import { supabase } from './supabaseClient';

const TABLE = 'daily_moods';

function fromRow(row) {
  if (!row) return null;
  return { id: row.mood_id, emoji: row.mood_emoji, label: row.mood_label };
}

/** Ánimo guardado para un día puntual (formato YYYY-MM-DD), o null si nadie tocó nada todavía. */
export async function fetchMoodForDay(day) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('day', day).maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

/** Un solo emoji por día: si se toca otro, se sobreescribe (no se acumula historial). */
export async function setMoodForDay(day, mood) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ day, mood_id: mood.id, mood_emoji: mood.emoji, mood_label: mood.label });
  if (error) throw error;
}

export function subscribeToMood(day, onChange) {
  const channel = supabase
    .channel(`mood-${day}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `day=eq.${day}` },
      (payload) => onChange(payload.eventType === 'DELETE' ? null : fromRow(payload.new))
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
