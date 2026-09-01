import { isIOSDevice, isRunningStandalone } from './pwaUtils';

/**
 * Web Push desde el lado del navegador.
 *
 * Lo importante de iOS: las notificaciones web SÓLO funcionan si la PWA está
 * instalada en la pantalla de inicio (iOS 16.4+). En una pestaña de Safari
 * `PushManager` ni siquiera existe, así que hay que explicarle a la persona
 * que primero tiene que instalar la app en vez de mostrarle un botón que no
 * va a andar.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY);

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

/**
 * Por qué no se puede activar todavía, o null si sí se puede.
 * Se usa para mostrar el motivo real en vez de un botón muerto.
 */
export function pushBlockedReason() {
  if (!isPushConfigured) return 'unconfigured';
  if (isIOSDevice() && !isRunningStandalone()) return 'ios-necesita-instalar';
  if (!isPushSupported()) return 'no-soportado';
  if (getPermission() === 'denied') return 'permiso-denegado';
  return null;
}

export function getPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'default';
}

/** La clave VAPID viaja en base64url y `subscribe()` la quiere en bytes. */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** El endpoint + las claves que necesita el servidor para cifrar el push. */
function serializeSubscription(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh || '',
    auth: json.keys?.auth || ''
  };
}

/**
 * Pide permiso y se suscribe. TIENE que llamarse desde un tap real: iOS
 * ignora `requestPermission()` si no viene de un gesto del usuario.
 */
export async function enablePush() {
  if (!isPushSupported()) throw new Error('Este dispositivo no soporta notificaciones web.');
  if (!isPushConfigured) throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  return serializeSubscription(subscription);
}

/** Devuelve la suscripción existente sin pedir permiso, o null. */
export async function getExistingSubscription() {
  if (!isPushSupported() || getPermission() !== 'granted') return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? serializeSubscription(subscription) : null;
  } catch {
    return null;
  }
}

export async function disablePush() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;

  const serialized = serializeSubscription(subscription);
  await subscription.unsubscribe();
  return serialized;
}

/** Apaga el puntito del ícono y cierra los avisos: ya los vieron. */
export function clearBadge() {
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  }
  navigator.serviceWorker?.ready
    .then((registration) => registration.active?.postMessage({ type: 'CLEAR_BADGE' }))
    .catch(() => {});
}
