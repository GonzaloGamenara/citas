/** true si la app ya corre instalada (abierta desde el ícono de inicio, no desde el navegador). */
export function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator?.standalone === true; // sólo existe en iOS Safari
  return Boolean(mediaStandalone || iosStandalone);
}

/** Detecta iPhone/iPod y también iPad en iPadOS 13+, que se identifica como Mac con touch. */
export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIphoneIpod = /iPhone|iPod/.test(ua);
  const isIpadModern = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIphoneIpod || /iPad/.test(ua) || isIpadModern;
}

export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent || '');
}
