import { useEffect } from 'react';

/**
 * Cambia el color de la barra del sistema (hora, batería, wifi) mientras el
 * componente está montado y lo restaura al salir. Sin esto, sobre el
 * escritorio oscuro de las cartas la barra queda rosa y "corta" la pantalla.
 */
export function useThemeColor(color) {
  useEffect(() => {
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    if (metas.length === 0) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
      metas.push(meta);
    }
    const previous = metas.map((m) => m.getAttribute('content'));
    metas.forEach((m) => m.setAttribute('content', color));
    return () => metas.forEach((m, i) => m.setAttribute('content', previous[i] ?? ''));
  }, [color]);
}
