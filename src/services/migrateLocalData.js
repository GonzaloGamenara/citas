import { fetchDates, insertManyDates } from './datesService';
import { fetchWishlist, insertManyWishes } from './wishlistService';

const MIGRATION_FLAG = 'citas_supabase_migrated_v1';
const OLD_DATES_KEY = 'citas_history_dates_v2';
const OLD_WISHLIST_KEY = 'citas_wishlist_v1';

function readLocalArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Corre una sola vez por navegador, antes del primer fetch a Supabase.
 *
 * Si las tablas remotas están vacías:
 *  - si este dispositivo tenía citas/pendientes guardados de una versión
 *    anterior (sin Supabase), los sube — es la migración real.
 *  - si no había nada, siembra los datos de ejemplo pasados por parámetro,
 *    para que la primera vez que cualquiera de los dos entra no vea una
 *    pantalla vacía.
 *
 * Si Supabase ya tiene datos, no toca nada: la base es la fuente de verdad
 * y no hay que pisarla con lo que haya quedado cacheado en este equipo.
 */
export async function migrateLocalDataIfNeeded(seedDates, seedWishlist) {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  try {
    const [remoteDates, remoteWishlist] = await Promise.all([fetchDates(), fetchWishlist()]);

    if (remoteDates.length === 0) {
      const local = readLocalArray(OLD_DATES_KEY);
      await insertManyDates(local.length > 0 ? local : seedDates);
    }

    if (remoteWishlist.length === 0) {
      const local = readLocalArray(OLD_WISHLIST_KEY);
      await insertManyWishes(local.length > 0 ? local : seedWishlist);
    }

    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch (e) {
    // No marcamos el flag: si falló por un problema de red, se reintenta la próxima vez.
    console.error('Migración a Supabase falló, se reintentará en el próximo inicio:', e);
  }
}
