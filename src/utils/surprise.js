import { getTodayLocalISO } from './dateUtils';

/**
 * Pendientes sorpresa.
 *
 * La idea: el otro sabe que hay algo preparado, para cuándo y cuánto dura,
 * pero no qué es. Se destapa solo el día.
 *
 * El ocultamiento es de interfaz, no de seguridad: la fila viaja entera al
 * navegador y cualquiera que abra las herramientas de desarrollo la ve. Para
 * dos personas que se están haciendo un regalo eso alcanza — no hay nada que
 * proteger, sólo una sorpresa que no arruinar.
 */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** ¿Este pendiente todavía está tapado para quien lo está mirando? */
export function isSurpriseLocked(item, viewerId) {
  if (!item || !item.isSurprise) return false;
  // Quien la preparó siempre la ve: si no, no podría editarla.
  if (item.createdBy && item.createdBy === viewerId) return false;
  if (!item.surpriseDate) return true;
  return getTodayLocalISO() < item.surpriseDate;
}

/** Se destapó hoy (para poder festejarlo distinto de una sorpresa vieja). */
export function revealedToday(item) {
  return Boolean(item?.isSurprise && item.surpriseDate === getTodayLocalISO());
}

/** "2026-09-12" → "jueves 12 de septiembre". Se parsea a mano: `new Date` corre la zona. */
export function prettySurpriseDate(dateStr) {
  if (!dateStr) return 'algún día';
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  const label = `${weekday} ${d} de ${MONTHS[m - 1] || ''}`;
  // Sólo la inicial: con `text-transform: capitalize` quedaba
  // "Domingo 6 De Septiembre", con "De" en mayúscula.
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Cuántos días faltan. Negativo = ya pasó. */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [ty, tm, td] = getTodayLocalISO().split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(ty, tm - 1, td);
  return Math.round((target - today) / 86400000);
}

/** "faltan 3 días", "es mañana", "es hoy". */
export function countdownLabel(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days < 0) return 'ya pasó';
  if (days === 0) return 'es hoy';
  if (days === 1) return 'es mañana';
  return `faltan ${days} días`;
}
