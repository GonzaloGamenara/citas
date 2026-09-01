import { supabase } from './supabaseClient';

const TABLE = 'push_subscriptions';

/**
 * Dónde mandarle las notificaciones a cada uno.
 *
 * Una fila por navegador/dispositivo (la primary key es el endpoint que da
 * el push service). Si Juli tiene la app en el iPhone y también en un iPad,
 * son dos filas con el mismo `user_key`.
 */

export async function saveSubscription(userKey, subscription) {
  const { error } = await supabase.from(TABLE).upsert({
    endpoint: subscription.endpoint,
    user_key: userKey,
    p256dh: subscription.p256dh,
    auth: subscription.auth
  });
  if (error) throw error;
}

export async function deleteSubscription(endpoint) {
  const { error } = await supabase.from(TABLE).delete().eq('endpoint', endpoint);
  if (error) throw error;
}
