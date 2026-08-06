import { fetchDates, insertManyDates } from './datesService';
import { fetchWishlist, insertManyWishes } from './wishlistService';

const MIGRATION_FLAG = 'citas_supabase_migrated_v1';
const OLD_DATES_KEY = 'citas_history_dates_v2';
const OLD_WISHLIST_KEY = 'citas_wishlist_v1';

// IDs de los datos de ejemplo con los que arrancaba la app ANTES de tener
// Supabase (ver INITIAL_HISTORY_DATES en App.jsx y INITIAL_WISHLIST en
// WishlistModule.jsx). Cualquier dispositivo que haya abierto esa versión
// vieja los tiene guardados en su localStorage como si fueran "datos
// reales" — hay que descartarlos explícitamente para que no se cuelen en la
// migración y reaparezcan como pendientes/citas fantasma.
const KNOWN_SAMPLE_IDS = new Set(['sample-1', 'sample-2', 'wish-1', 'wish-2', 'wish-3']);

function readLocalArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && !KNOWN_SAMPLE_IDS.has(item.id)) : [];
  } catch {
    return [];
  }
}

/**
 * Corre una sola vez por dispositivo, antes del primer fetch a Supabase.
 *
 * SOLO migra datos reales que hubiera guardados en este dispositivo de la
 * versión anterior a Supabase (localStorage). Ya NO siembra contenido de
 * ejemplo si las tablas están vacías: eso tenía sentido para que la primera
 * apertura de la app no fuera una pantalla en blanco, pero una vez que hay
 * uso real, "la tabla está vacía" puede significar simplemente que alguien
 * borró todo a propósito — sembrar ahí hacía reaparecer pendientes/citas
 * fantasma. Las pantallas ya tienen su propio estado vacío (ver
 * HistoryModule/WishlistModule), no hace falta rellenarlas con datos falsos.
 *
 * El flag se marca apenas se logra CONSULTAR Supabase, sin importar si
 * después hubo algo para migrar o si el insert chocó con datos que ya había
 * subido el otro dispositivo (eso es normal, no un error a reintentar) — así
 * nunca se reintenta de más en este aparato. Sólo se deja sin marcar si la
 * consulta en sí falló (sin red, Supabase caído), que es el único caso
 * donde reintentar en el próximo inicio tiene sentido.
 */
export async function migrateLocalDataIfNeeded() {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  let remoteDates;
  let remoteWishlist;
  try {
    [remoteDates, remoteWishlist] = await Promise.all([fetchDates(), fetchWishlist()]);
  } catch (e) {
    console.error('No se pudo consultar Supabase para migrar, se reintenta en el próximo inicio:', e);
    return;
  }

  if (remoteDates.length === 0) {
    const local = readLocalArray(OLD_DATES_KEY);
    if (local.length > 0) {
      try {
        await insertManyDates(local);
      } catch (e) {
        console.error('No se pudieron migrar las citas guardadas en este dispositivo:', e);
      }
    }
  }

  if (remoteWishlist.length === 0) {
    const local = readLocalArray(OLD_WISHLIST_KEY);
    if (local.length > 0) {
      try {
        await insertManyWishes(local);
      } catch (e) {
        console.error('No se pudieron migrar los pendientes guardados en este dispositivo:', e);
      }
    }
  }

  localStorage.setItem(MIGRATION_FLAG, '1');
}
