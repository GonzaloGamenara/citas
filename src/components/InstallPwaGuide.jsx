import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, SquarePlus, PlusSquare, MoreVertical, Download } from 'lucide-react';
import { isRunningStandalone, isIOSDevice, isAndroidDevice } from '../utils/pwaUtils';

const SEEN_FLAG = 'citas_pwa_banner_seen_v1';

/**
 * Tutorial de instalación como PWA, con foco en iPhone (Safari no soporta
 * `beforeinstallprompt`, así que ahí no hay forma de disparar un instalador
 * nativo — sólo se puede explicar los pasos).
 *
 * Se auto-abre una vez por navegador si la app no está corriendo instalada.
 * Después queda disponible a demanda desde el botón "📲" del Navbar, que
 * dispara el evento `open-pwa-guide` (evita pasar props/estado por toda la
 * jerarquía sólo para esto).
 */
const InstallPwaGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState('other'); // 'ios' | 'android' | 'other'
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [standalone, setStandalone] = useState(true); // arranca en true para no flashear nada antes de detectar
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    const alreadyInstalled = isRunningStandalone();
    setStandalone(alreadyInstalled);
    setPlatform(isIOSDevice() ? 'ios' : isAndroidDevice() ? 'android' : 'other');

    if (!alreadyInstalled && !localStorage.getItem(SEEN_FLAG)) {
      const timer = setTimeout(() => setIsOpen(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  // Chrome/Edge en Android permiten instalar con un botón real
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanNativeInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Apertura manual desde el botón del Navbar
  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener('open-pwa-guide', openHandler);
    return () => window.removeEventListener('open-pwa-guide', openHandler);
  }, []);

  // Si se instala mientras el modal está abierto (Android nativo), lo cerramos solos
  useEffect(() => {
    const installedHandler = () => {
      setStandalone(true);
      setIsOpen(false);
    };
    window.addEventListener('appinstalled', installedHandler);
    return () => window.removeEventListener('appinstalled', installedHandler);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(SEEN_FLAG, '1');
  };

  const handleNativeInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    deferredPromptRef.current = null;
    setCanNativeInstall(false);
    handleClose();
  };

  if (standalone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal-card pwa-guide-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">📲 Instalá la app</h3>
              <button className="modal-close-btn" onClick={handleClose}>
                <X size={18} />
              </button>
            </div>

            <div className="pwa-guide-body">
              <p className="pwa-guide-intro">
                Agregala a tu pantalla de inicio: abre más rápido, ocupa toda la pantalla
                como una app de verdad y les queda un ícono para entrar directo.
              </p>

              {platform === 'ios' && (
                <ol className="pwa-guide-steps">
                  <li>
                    <span className="pwa-step-icon"><Share size={18} /></span>
                    <span>Tocá el botón <b>Compartir</b> en la barra de abajo de Safari</span>
                  </li>
                  <li>
                    <span className="pwa-step-icon"><SquarePlus size={18} /></span>
                    <span>Elegí <b>"Agregar a inicio"</b> (a veces hay que bajar en la lista para verla)</span>
                  </li>
                  <li>
                    <span className="pwa-step-icon"><PlusSquare size={18} /></span>
                    <span>Tocá <b>"Agregar"</b> arriba a la derecha — ¡y listo! 💕</span>
                  </li>
                </ol>
              )}

              {platform === 'android' && (
                canNativeInstall ? (
                  <button
                    type="button"
                    className="btn-disney-primary"
                    onClick={handleNativeInstall}
                    style={{ marginTop: '0.6rem' }}
                  >
                    <Download size={16} />
                    <span>Instalar ahora</span>
                  </button>
                ) : (
                  <ol className="pwa-guide-steps">
                    <li>
                      <span className="pwa-step-icon"><MoreVertical size={18} /></span>
                      <span>Tocá los <b>3 puntitos</b> arriba a la derecha del navegador</span>
                    </li>
                    <li>
                      <span className="pwa-step-icon"><PlusSquare size={18} /></span>
                      <span>Elegí <b>"Instalar app"</b> o <b>"Agregar a pantalla de inicio"</b></span>
                    </li>
                  </ol>
                )
              )}

              {platform === 'other' && (
                <p className="pwa-guide-intro">
                  Desde la compu, buscá el ícono de instalar (⊕ o una pantallita) en la
                  barra de direcciones del navegador.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-disney-secondary" onClick={handleClose}>
                Ahora no
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPwaGuide;
