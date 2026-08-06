import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * SOLO la publishable/anon key va acá. Es la key pensada para vivir en el
 * navegador (queda visible en el bundle JS de cualquiera que inspeccione la
 * app) — la seguridad real la da Row Level Security en las tablas, no el
 * secreto de esta key.
 *
 * La secret key de Supabase (bypasea RLS por completo) NUNCA debe entrar acá
 * ni a ningún archivo del repo.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Copiá .env.example a .env y completá los valores (ver TECHNICAL_DOCUMENTATION.md).'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/** true si las env vars están cargadas: útil para mostrar un estado de error claro en vez de fallos silenciosos */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
