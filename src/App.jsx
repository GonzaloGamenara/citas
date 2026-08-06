import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import BackgroundSparkles from './components/BackgroundSparkles';
import Navbar from './components/Navbar';
import Home from './components/Home';
import HistoryModule from './components/HistoryModule';
import WishlistModule, { INITIAL_WISHLIST } from './components/WishlistModule';
import CabaEventsModule from './components/CabaEventsModule';
import CandleOverlay from './components/CandleOverlay';
import InstallPwaGuide from './components/InstallPwaGuide';
import { getTodayLocalISO } from './utils/dateUtils';
import { isSupabaseConfigured } from './services/supabaseClient';
import { fetchDates, upsertDate, deleteDate, subscribeToDates } from './services/datesService';
import { fetchWishlist, upsertWish, deleteWish, subscribeToWishlist } from './services/wishlistService';
import { fetchMoodForDay, setMoodForDay, subscribeToMood } from './services/moodService';
import { migrateLocalDataIfNeeded } from './services/migrateLocalData';
import './styles/theme.css';

const INITIAL_HISTORY_DATES = [
  {
    id: 'sample-1',
    title: 'Primera Merienda y Paseo ☕🌳',
    date: '2026-07-15',
    time: '17:30 hs',
    duration: '2.5 hs',
    categories: ['cafe', 'postre', 'paseo'],
    locations: [
      { name: 'Café Paul Gallery', lat: -34.5895, lon: -58.4320, fullAddress: 'Café Paul Gallery, Gorriti 4865, Palermo, CABA' },
      { name: 'Plaza Serrano', lat: -34.5885, lon: -58.4300, fullAddress: 'Plaza Serrano, Palermo, CABA' }
    ],
    mediaItems: [],
    notes: 'Charlamos de todo, nos reímos muchísimo, probamos café helado y caminamos por Palermo.'
  },
  {
    id: 'sample-2',
    title: 'Noche de Cine y Vinito 🎬🍷',
    date: '2026-07-22',
    time: '20:00 hs',
    duration: '3.5 hs',
    categories: ['cine', 'tragos', 'vino'],
    locations: [
      { name: 'Cine Showcase Belgrano', lat: -34.5567, lon: -58.4550, fullAddress: 'Showcase Cinema Belgrano, CABA' },
      { name: 'Bar de Vinos San Telmo', lat: -34.6200, lon: -58.3720, fullAddress: 'San Telmo, Buenos Aires' }
    ],
    mediaItems: [
      {
        id: 'movie-sample-1',
        title: 'Intensamente 2',
        genre: 'Animación',
        year: 2024,
        type: 'movie',
        poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/0d/1b/09/0d1b09b5-4b0e-6e21-5a02-60c7f384cfae/job_ccba821e-152e-436f-872f-598d6fa7c617.jpg/400x400bb.jpg'
      }
    ],
    notes: 'Hermosa película en el cine y después unos vinos para cerrar la noche.'
  }
];

// v3/v2: antes de tener Supabase, estas claves guardaban directamente los
// datos de ejemplo (sample-1/2, wish-1/2/3) como si fueran reales. Cualquier
// dispositivo que haya abierto esa versión vieja los tiene cacheados acá. Se
// suben de versión para que ese caché contaminado quede huérfano y se
// ignore — el primer fetch a Supabase repuebla todo con los datos reales.
const DATES_CACHE_KEY = 'citas_history_dates_v3';
const WISHLIST_CACHE_KEY = 'citas_wishlist_v2';

/**
 * Caché local de respaldo: sólo se usa para pintar algo instantáneo al abrir
 * la app (importante en la PWA, con conexión mala) y como red de contención
 * si Supabase no responde. La fuente de verdad es siempre Supabase.
 */
function loadCache(key) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(`Error leyendo caché "${key}":`, e);
  }
  return [];
}

function saveCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error guardando caché "${key}":`, e);
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('home');

  // El Modo Vela es una preferencia visual del dispositivo, no de la pareja:
  // cada uno puede tener su propio celular en modo día o modo noche.
  const [isCandleMode, setIsCandleMode] = useState(() => {
    try {
      return localStorage.getItem('citas_candle_mode_v1') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('citas_candle_mode_v1', isCandleMode ? '1' : '0');
    } catch (e) {
      console.error('Error guardando preferencia de Modo Vela:', e);
    }
  }, [isCandleMode]);

  const [historyDates, setHistoryDates] = useState(() => loadCache(DATES_CACHE_KEY));
  const [wishlist, setWishlist] = useState(() => loadCache(WISHLIST_CACHE_KEY));

  // La pantalla "Hoy" (DailyCheckin) está desactivada por ahora — Home la
  // reemplaza en ese lugar del nav — pero se deja el fetch/realtime del
  // ánimo del día andando para no perder la sincronización si se reactiva.
  const [todayMood, setTodayMood] = useState(null);

  // 'loading' mientras arranca | 'live' conectado y sincronizando | 'offline'
  // falló la conexión (se sigue usando lo último guardado) | 'unconfigured'
  // no hay .env de Supabase: la app funciona igual, pero sólo en este equipo.
  const [syncState, setSyncState] = useState('loading');

  const todayISO = getTodayLocalISO();

  // Carga inicial: migración (si hace falta) + primer fetch de las 3 fuentes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setHistoryDates((prev) => (prev.length > 0 ? prev : INITIAL_HISTORY_DATES));
      setWishlist((prev) => (prev.length > 0 ? prev : INITIAL_WISHLIST));
      setSyncState('unconfigured');
      return;
    }

    let cancelled = false;

    (async () => {
      await migrateLocalDataIfNeeded();

      try {
        const [dates, wishes, mood] = await Promise.all([
          fetchDates(),
          fetchWishlist(),
          fetchMoodForDay(todayISO)
        ]);
        if (cancelled) return;

        setHistoryDates(dates);
        setWishlist(wishes);
        setTodayMood(mood);
        saveCache(DATES_CACHE_KEY, dates);
        saveCache(WISHLIST_CACHE_KEY, wishes);
        setSyncState('live');
      } catch (e) {
        console.error('No se pudo conectar con Supabase, se muestra lo último guardado en este equipo:', e);
        if (!cancelled) setSyncState('offline');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tiempo real: citas
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return subscribeToDates({
      onInsert: (item) => setHistoryDates((prev) => (prev.some((d) => d.id === item.id) ? prev : [item, ...prev])),
      onUpdate: (item) => setHistoryDates((prev) => prev.map((d) => (d.id === item.id ? item : d))),
      onDelete: (id) => setHistoryDates((prev) => prev.filter((d) => d.id !== id))
    });
  }, []);

  // Tiempo real: wishlist
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return subscribeToWishlist({
      onInsert: (item) => setWishlist((prev) => (prev.some((w) => w.id === item.id) ? prev : [item, ...prev])),
      onUpdate: (item) => setWishlist((prev) => prev.map((w) => (w.id === item.id ? item : w))),
      onDelete: (id) => setWishlist((prev) => prev.filter((w) => w.id !== id))
    });
  }, []);

  // Tiempo real: ánimo de hoy (si Juli lo toca desde su teléfono, Gonza lo ve solo)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return subscribeToMood(todayISO, setTodayMood);
  }, [todayISO]);

  // Espejo en localStorage en cada cambio: sirve de caché offline-first para la PWA
  useEffect(() => {
    saveCache(DATES_CACHE_KEY, historyDates);
  }, [historyDates]);

  useEffect(() => {
    saveCache(WISHLIST_CACHE_KEY, wishlist);
  }, [wishlist]);

  const handleSaveHistoryDate = useCallback((newOrUpdatedDate) => {
    setHistoryDates((prev) => {
      const exists = prev.some((item) => item.id === newOrUpdatedDate.id);
      return exists
        ? prev.map((item) => (item.id === newOrUpdatedDate.id ? newOrUpdatedDate : item))
        : [newOrUpdatedDate, ...prev];
    });
    if (isSupabaseConfigured) {
      upsertDate(newOrUpdatedDate).catch((e) => console.error('Error guardando cita en Supabase:', e));
    }
  }, []);

  const handleDeleteHistoryDate = useCallback((idToDelete) => {
    setHistoryDates((prev) => prev.filter((item) => item.id !== idToDelete));
    if (isSupabaseConfigured) {
      deleteDate(idToDelete).catch((e) => console.error('Error borrando cita en Supabase:', e));
    }
  }, []);

  const handleAddWish = useCallback((newWish) => {
    setWishlist((prev) => [newWish, ...prev]);
    if (isSupabaseConfigured) {
      upsertWish(newWish).catch((e) => console.error('Error guardando pendiente en Supabase:', e));
    }
  }, []);

  const handleDeleteWish = useCallback((idToDelete) => {
    setWishlist((prev) => prev.filter((item) => item.id !== idToDelete));
    if (isSupabaseConfigured) {
      deleteWish(idToDelete).catch((e) => console.error('Error borrando pendiente en Supabase:', e));
    }
  }, []);

  const handleConvertWishToDate = useCallback(
    (wishItem) => {
      const newDateItem = {
        id: `date-from-wish-${Date.now()}`,
        title: wishItem.title,
        date: getTodayLocalISO(),
        time: '19:00 hs',
        duration: '2.5 hs',
        categories: [wishItem.category || 'cafe'],
        locations: [{ name: wishItem.location || 'CABA' }],
        mediaItems: [],
        notes: wishItem.notes || '¡Pendiente cumplido y disfrutado juntos!'
      };

      handleSaveHistoryDate(newDateItem);
      handleDeleteWish(wishItem.id);
      setActiveTab('history');
    },
    [handleSaveHistoryDate, handleDeleteWish]
  );

  const handleSelectMood = useCallback(
    (mood) => {
      setTodayMood(mood);
      if (isSupabaseConfigured) {
        setMoodForDay(todayISO, mood).catch((e) => console.error('Error guardando ánimo en Supabase:', e));
      }
    },
    [todayISO]
  );

  return (
    <main className={`app-container ${isCandleMode ? 'candle-mode-active' : ''}`}>
      <BackgroundSparkles />
      <CandleOverlay isCandleMode={isCandleMode} />
      <InstallPwaGuide />

      {syncState === 'offline' && (
        <div className="sync-banner">
          📡 Sin conexión con el servidor: viendo lo último guardado en este equipo.
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCandleMode={isCandleMode}
        setIsCandleMode={setIsCandleMode}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'home' && <Home key="home-tab" onNavigate={setActiveTab} />}

        {activeTab === 'history' && (
          <HistoryModule
            key="history-tab"
            historyDates={historyDates}
            onSaveDate={handleSaveHistoryDate}
            onDeleteDate={handleDeleteHistoryDate}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistModule
            key="wishlist-tab"
            wishlist={wishlist}
            onAddWish={handleAddWish}
            onDeleteWish={handleDeleteWish}
            onConvertToDate={handleConvertWishToDate}
          />
        )}

        {activeTab === 'caba' && (
          <CabaEventsModule
            key="caba-tab"
            onAddToWishlist={(newWish) => {
              handleAddWish(newWish);
              setActiveTab('wishlist');
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
