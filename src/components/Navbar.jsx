import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CalendarHeart, Bookmark, Compass, Flame, Sun, Smartphone } from 'lucide-react';
import { isRunningStandalone } from '../utils/pwaUtils';

const Navbar = ({ activeTab, setActiveTab, isCandleMode, setIsCandleMode }) => {
  // No tiene sentido ofrecer "instalar" si ya se está usando la app instalada
  const [showInstallButton, setShowInstallButton] = useState(false);
  useEffect(() => {
    setShowInstallButton(!isRunningStandalone());
  }, []);

  return (
    <div className="app-nav-container">
      <div className="theme-toggle-wrapper">
        {showInstallButton && (
          <button
            onClick={() => window.dispatchEvent(new Event('open-pwa-guide'))}
            className="install-pwa-btn"
            title="Instalar la app en tu pantalla de inicio"
          >
            <Smartphone size={16} />
            <span>Instalar</span>
          </button>
        )}

        {/* Botón Modo Noche / Luz de Vela 🕯️ */}
        <button
          onClick={() => setIsCandleMode(!isCandleMode)}
          className={`candle-toggle-btn ${isCandleMode ? 'candle-active' : ''}`}
          title={isCandleMode ? 'Desactivar Modo Vela' : 'Activar Modo Vela Romántico 🕯️'}
        >
          {isCandleMode ? <Flame size={16} color="#fbbf24" className="flame-icon-pulse" /> : <Sun size={16} />}
          <span>{isCandleMode ? 'Modo Vela 🕯️' : 'Modo Día ☀️'}</span>
        </button>
      </div>

      <div className="nav-segmented-control multi-tabs">
        <button
          onClick={() => setActiveTab('today')}
          className={`nav-btn ${activeTab === 'today' ? 'active' : ''}`}
        >
          {activeTab === 'today' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <Sparkles size={14} />
            <span>Hoy</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          {activeTab === 'history' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <CalendarHeart size={14} />
            <span>Citas</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`nav-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
        >
          {activeTab === 'wishlist' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <Bookmark size={14} />
            <span>Pendientes</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('caba')}
          className={`nav-btn ${activeTab === 'caba' ? 'active' : ''}`}
        >
          {activeTab === 'caba' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <Compass size={14} />
            <span>CABA</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
