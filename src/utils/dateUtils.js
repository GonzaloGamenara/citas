/**
 * Fecha de hoy en formato YYYY-MM-DD según el huso horario del dispositivo.
 *
 * `new Date().toISOString()` devuelve la fecha en UTC: en Argentina (UTC-3)
 * desde las 21:00 en adelante eso adelanta el día y las citas nuevas quedaban
 * pre-cargadas con la fecha del día siguiente.
 */
export function getTodayLocalISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
