/**
 * Manda la notificación al OTRO cuando aparece una cita o un pendiente nuevo.
 *
 * La dispara un Database Webhook de Supabase en el INSERT de `dates` y
 * `wishlist` (ver scripts/supabase-schema.sql para el SQL que los crea).
 *
 * Por qué acá y no en el cliente: el push hay que firmarlo con la clave
 * privada VAPID, que no puede vivir en el bundle del navegador. Además, el
 * teléfono del que recibe puede estar cerrado — justamente por eso hay push.
 *
 * Secrets necesarios (Dashboard → Edge Functions → Secrets):
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, NOTIFY_SECRET
 * SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.
 *
 * La función se despliega sin verificación de JWT (el trigger de Postgres no
 * tiene un token de usuario que mandar), así que se protege con NOTIFY_SECRET:
 * sin ese header no se manda ninguna notificación. Si no estuviera, cualquiera
 * que descubriera la URL podría meterles avisos falsos en el teléfono.
 */
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:gonzagamenara@gmail.com';
const NOTIFY_SECRET = Deno.env.get('NOTIFY_SECRET') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const NAMES: Record<string, string> = { gonza: 'Gonza', juli: 'Juli' };

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/** "2026-09-12" → "12 de septiembre". A mano, para no arrastrar la zona horaria. */
function formatDay(dateStr: string | null): string {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1] ?? ''}`;
}

/** El otro de los dos. Si no sabemos quién escribió, no se notifica a nadie. */
function partnerOf(userKey: string | null): string | null {
  if (userKey === 'gonza') return 'juli';
  if (userKey === 'juli') return 'gonza';
  return null;
}

function buildMessage(table: string, row: Record<string, unknown>) {
  const author = NAMES[String(row.created_by ?? '')] ?? 'Alguien';
  const title = String(row.title ?? '').trim();

  if (table === 'dates') {
    return {
      title: `${author} agregó una cita 💛`,
      body: title || 'Entrá a ver de qué se trata.',
      tag: 'cita-nueva',
      url: '/'
    };
  }

  // Sorpresa: se avisa que hay algo y para cuándo, nunca qué es. El título
  // no puede entrar acá — la notificación se ve en la pantalla bloqueada.
  if (row.is_surprise) {
    const hints = String(row.hint_emojis ?? '').trim();
    const when = formatDay(row.surprise_date as string | null);
    const duration = String(row.surprise_duration ?? '').trim();

    const parts = [when, duration].filter(Boolean).join(' · ');
    return {
      title: `${author} preparó algo 🎁`,
      body: [parts, hints].filter(Boolean).join('  ') || 'Se destapa el día.',
      tag: 'sorpresa-nueva',
      url: '/'
    };
  }

  return {
    title: `${author} agregó un pendiente ✨`,
    body: title || 'Entrá a ver de qué se trata.',
    tag: 'pendiente-nuevo',
    url: '/'
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Sólo el trigger de la base conoce este secreto.
  if (!NOTIFY_SECRET || req.headers.get('x-notify-secret') !== NOTIFY_SECRET) {
    return new Response(JSON.stringify({ error: 'no autorizado' }), { status: 401 });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('Faltan las claves VAPID: no se puede firmar el push.');
    return new Response(JSON.stringify({ error: 'VAPID sin configurar' }), { status: 500 });
  }

  let payload: { type?: string; table?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'body inválido' }), { status: 400 });
  }

  const { type, table, record } = payload;
  if (type !== 'INSERT' || !record || (table !== 'dates' && table !== 'wishlist')) {
    // Ediciones y borrados no avisan: sólo las novedades.
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const target = partnerOf((record.created_by as string) ?? null);
  if (!target) {
    console.log('Fila sin created_by: no hay a quién avisarle.');
    return new Response(JSON.stringify({ skipped: 'sin autor' }), { status: 200 });
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_key', target);

  if (error) {
    console.error('No se pudieron leer las suscripciones:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'sin dispositivos' }), { status: 200 });
  }

  const message = JSON.stringify(buildMessage(table, record));

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message,
        { TTL: 60 * 60 * 24 }
      )
    )
  );

  // Un 404/410 significa que ese dispositivo desinstaló la app o revocó el
  // permiso: la fila ya no sirve y se limpia sola.
  const stale: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const status = (result.reason as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        stale.push(subscriptions[i].endpoint);
      } else {
        console.error('Fallo enviando push:', result.reason);
      }
    }
  });

  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale);
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent, removed: stale.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
