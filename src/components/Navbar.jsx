import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, CalendarHeart, Bookmark, HelpCircle, Flame, Sun, Smartphone } from 'lucide-react';
import { isRunningStandalone } from '../utils/pwaUtils';
import { PEOPLE, partnerOf } from '../utils/identity';

const Navbar = ({ activeTab, setActiveTab, isCandleMode, setIsCandleMode, identity, onSwitchIdentity }) => {
  const me = PEOPLE.find((p) => p.id === identity);
  const other = PEOPLE.find((p) => p.id === partnerOf(identity));
  // No tiene sentido ofrecer "instalar" si ya se está usando la app instalada
  const [showInstallButton, setShowInstallButton] = useState(false);
  useEffect(() => {
    setShowInstallButton(!isRunningStandalone());
  }, []);

  return (
    <div className="app-nav-container">
      <div className="theme-toggle-wrapper">
        {/* Escape hatch: si alguien tocó el nombre equivocado al entrar, acá
            lo cambia sin tener que reinstalar la app. */}
        {me && other && (
          <button
            onClick={() => onSwitchIdentity(other.id)}
            className="identity-pill"
            title={`Estás como ${me.name} — tocá para cambiar a ${other.name}`}
          >
            <span aria-hidden="true">{me.emoji}</span>
            <span>{me.name}</span>
          </button>
        )}

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
          onClick={() => setActiveTab('home')}
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          {activeTab === 'home' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <Home size={14} />
            <span>Inicio</span>
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
          onClick={() => setActiveTab('cards')}
          className={`nav-btn ${activeTab === 'cards' ? 'active' : ''}`}
        >
          {activeTab === 'cards' && (
            <motion.div
              layoutId="activePill"
              className="nav-active-bg"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="nav-btn-content">
            <HelpCircle size={14} />
            <span>Secreto</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
