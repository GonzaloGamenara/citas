import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  RotateCcw,
  ArrowLeftRight
} from 'lucide-react';
import { DESCONECTADOS_CARDS, CARD_CATEGORIES } from '../data/cardsData';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { fetchCardState, saveCardState, clearSeenCards, subscribeToCardState } from '../services/cardsService';

export const UNLOCKED_STORAGE_KEY = 'citas_cards_unlocked_v2';
const STATE_CACHE_KEY = 'citas_cards_state_v1';
const LEGACY_FAVORITES_KEY = 'citas_favorite_cards_v1';
const TURN_STORAGE_KEY = 'citas_cards_turn_v1';
const SECRET_UNLOCK_CODE = '310726';

/**
 * De a dos: el mazo es un juego por turnos, no una lista para hojear solo.
 * Quien figura acá es quien responde la carta que está sobre la mesa.
 */
const PLAYERS = ['Gonza', 'Juli'];

const CARD_BY_ID = new Map(DESCONECTADOS_CARDS.map((card) => [card.id, card]));
const ALL_IDS = DESCONECTADOS_CARDS.map((card) => card.id);

/** Fisher-Yates. */
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Caché local del estado del mazo. La fuente de verdad es Supabase (así el
 * progreso y las favoritas son de los dos), pero se pinta algo al instante y
 * se sigue pudiendo jugar sin señal.
 */
function loadLocalState() {
  try {
    const saved = localStorage.getItem(STATE_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        seen: Array.isArray(parsed.seen) ? parsed.seen : []
      };
    }

    // Migración de la versión anterior, que sólo guardaba favoritas locales.
    const legacy = localStorage.getItem(LEGACY_FAVORITES_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return { favorites: parsed, seen: [] };
    }
  } catch (e) {
    console.error('Error leyendo el estado del mazo:', e);
  }
  return { favorites: [], seen: [] };
}

/** Emoji de tono de la carta: textura, no filtro. */
const CATEGORY_EMOJI = CARD_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.emoji;
  return acc;
}, {});

const CardsModule = () => {
  const prefersReducedMotion = useReducedMotion();

  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return localStorage.getItem(UNLOCKED_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [pinCode, setPinCode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const pinInputRef = useRef(null);

  const [{ favorites, seen }, setCardState] = useState(loadLocalState);
  // 'live' = sincronizado con el otro teléfono | 'local' = sólo en este equipo
  const [syncState, setSyncState] = useState(isSupabaseConfigured ? 'live' : 'local');

  const [order, setOrder] = useState(() => shuffleArray(ALL_IDS));
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [direction, setDirection] = useState(1);
  const [turn, setTurn] = useState(() => {
    try {
      return localStorage.getItem(TURN_STORAGE_KEY) === '1' ? 1 : 0;
    } catch {
      return 0;
    }
  });

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const seenSet = useMemo(() => new Set(seen), [seen]);

  const celebrate = useCallback(
    (options) => {
      if (prefersReducedMotion) return;
      try {
        confetti(options);
      } catch {
        /* confetti es decorativo: si falla, el juego sigue igual */
      }
    },
    [prefersReducedMotion]
  );

  // ---------- Persistencia ----------

  useEffect(() => {
    try {
      localStorage.setItem(STATE_CACHE_KEY, JSON.stringify({ favorites, seen }));
    } catch (e) {
      console.error('Error guardando el estado del mazo:', e);
    }
  }, [favorites, seen]);

  useEffect(() => {
    try {
      localStorage.setItem(TURN_STORAGE_KEY, String(turn));
    } catch {
      /* el turno es una comodidad: si no se puede guardar, no pasa nada */
    }
  }, [turn]);

  // Primer fetch del estado compartido. Si la tabla todavía no existe en
  // Supabase la app no se rompe: se juega con lo que hay en este equipo.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUnlocked) return;

    let cancelled = false;
    fetchCardState()
      .then((remote) => {
        if (cancelled) return;
        setCardState(remote);
        setSyncState('live');
      })
      .catch((e) => {
        console.error('No se pudo leer el estado del mazo desde Supabase:', e);
        if (!cancelled) setSyncState('local');
      });

    return () => {
      cancelled = true;
    };
  }, [isUnlocked]);

  // Realtime: si Juli marca una favorita desde su teléfono, acá aparece sola.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUnlocked) return;

    return subscribeToCardState(({ cardId, favorite, seen: isSeen }) => {
      setCardState((prev) => ({
        favorites: favorite
          ? prev.favorites.includes(cardId)
            ? prev.favorites
            : [...prev.favorites, cardId]
          : prev.favorites.filter((id) => id !== cardId),
        seen: isSeen
          ? prev.seen.includes(cardId)
            ? prev.seen
            : [...prev.seen, cardId]
          : prev.seen.filter((id) => id !== cardId)
      }));
    });
  }, [isUnlocked]);

  /** Escribe en Supabase sin bloquear la UI: local manda, el server se entera después. */
  const pushCardState = useCallback((cardId, next) => {
    if (!isSupabaseConfigured) return;
    saveCardState(cardId, next).catch((e) => {
      console.error('Error sincronizando la carta con Supabase:', e);
      setSyncState('local');
    });
  }, []);

  const markSeen = useCallback(
    (cardId) => {
      setCardState((prev) => {
        if (prev.seen.includes(cardId)) return prev;
        pushCardState(cardId, { favorite: prev.favorites.includes(cardId), seen: true });
        return { ...prev, seen: [...prev.seen, cardId] };
      });
    },
    [pushCardState]
  );

  // ---------- El mazo ----------

  // El mazo entero en el orden barajado. Sin filtros: la única vista aparte
  // es la de favoritas, que es volver sobre lo que ya eligieron.
  const eligibleIds = useMemo(
    () => (onlyFavorites ? order.filter((id) => favoriteSet.has(id)) : order),
    [order, onlyFavorites, favoriteSet]
  );

  // Lo que queda por sacar. En el mazo no se repite nada ya jugado; en
  // favoritas sí, porque ahí el punto es justamente volver sobre ellas.
  const queue = useMemo(
    () => eligibleIds.filter((id) => id !== currentId && (onlyFavorites || !seenSet.has(id))),
    [eligibleIds, currentId, onlyFavorites, seenSet]
  );

  const currentCard = currentId === null ? null : CARD_BY_ID.get(currentId) || null;
  const isFavorite = currentId !== null && favoriteSet.has(currentId);

  const totalCards = eligibleIds.length;
  const playedCount = useMemo(
    () => eligibleIds.filter((id) => seenSet.has(id)).length,
    [eligibleIds, seenSet]
  );
  // Todavía no marcaron ninguna favorita.
  const isFilterEmpty = eligibleIds.length === 0;
  // Respondieron todo lo que había: no queda carta en juego ni en la cola.
  const isDeckFinished = !isFilterEmpty && currentId === null && queue.length === 0;

  /**
   * Si la carta actual dejó de pertenecer a la vista (se desmarcó de
   * favoritas estando en esa vista) o todavía no hay ninguna,
   * se pone otra en juego. Esto reemplaza al índice numérico de antes, que
   * quedaba apuntando fuera de rango cuando la lista se achicaba.
   *
   * Sólo saca de la cola: si no queda nada, deja el mazo vacío en vez de
   * volver a mostrar una carta ya jugada.
   */
  useEffect(() => {
    if (!isUnlocked) return;
    if (currentId !== null && eligibleIds.includes(currentId)) return;

    setCurrentId(queue.length > 0 ? queue[0] : null);
    setHistory([]);
  }, [isUnlocked, currentId, eligibleIds, queue]);

  /**
   * Una carta cuenta como jugada cuando la dejan atrás, no cuando aparece.
   * Marcarla al mostrarla quemaba una pregunta cada vez que entraban a la
   * pestaña sin llegar a leerla.
   */
  const handleNext = useCallback(() => {
    if (currentId === null) return;
    markSeen(currentId);
    setDirection(1);
    setHistory((prev) => [...prev, currentId]);
    setCurrentId(queue.length > 0 ? queue[0] : null);
    setTurn((prev) => 1 - prev);
  }, [queue, currentId, markSeen]);

  const handlePrev = useCallback(() => {
    if (history.length === 0) return;
    setDirection(-1);
    setCurrentId(history[history.length - 1]);
    setHistory((prev) => prev.slice(0, -1));
    setTurn((prev) => 1 - prev);
  }, [history]);

  /** Mezclar reordena lo que queda por salir y saca otra carta al toque. */
  const handleShuffle = useCallback(() => {
    if (currentId === null || queue.length === 0) return;

    const newOrder = shuffleArray(order);
    const pending = new Set(queue);
    const nextId = newOrder.find((id) => pending.has(id));
    if (nextId === undefined) return;

    markSeen(currentId);
    setOrder(newOrder);
    setDirection(1);
    setHistory((prev) => [...prev, currentId]);
    setCurrentId(nextId);
    setTurn((prev) => 1 - prev);
  }, [order, queue, currentId, markSeen]);

  const toggleFavorite = useCallback(() => {
    if (currentId === null) return;

    setCardState((prev) => {
      const exists = prev.favorites.includes(currentId);
      pushCardState(currentId, { favorite: !exists, seen: prev.seen.includes(currentId) });

      if (exists) {
        return { ...prev, favorites: prev.favorites.filter((id) => id !== currentId) };
      }

      celebrate({
        particleCount: 22,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#ff4770', '#ffb7b2', '#ffd6e0']
      });
      return { ...prev, favorites: [...prev.favorites, currentId] };
    });
  }, [currentId, pushCardState, celebrate]);

  /** Vuelve a poner todo el mazo en juego. */
  const handleResetDeck = useCallback(() => {
    setCardState((prev) => ({ ...prev, seen: [] }));
    setOrder(shuffleArray(ALL_IDS));
    setHistory([]);
    setCurrentId(null);
    setOnlyFavorites(false);

    if (isSupabaseConfigured) {
      clearSeenCards(ALL_IDS).catch((e) => {
        console.error('Error reiniciando el mazo en Supabase:', e);
        setSyncState('local');
      });
    }
  }, []);

  const handleToggleFavoritesView = useCallback(() => {
    setOnlyFavorites((prev) => !prev);
    setDirection(1);
  }, []);

  // Festejo cuando terminan una categoría entera: es el final del juego.
  const celebratedRef = useRef(null);
  useEffect(() => {
    const key = String(totalCards);
    if (!isDeckFinished) {
      if (celebratedRef.current === key) celebratedRef.current = null;
      return;
    }
    if (celebratedRef.current === key) return;
    celebratedRef.current = key;
    celebrate({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff4770', '#ffd6e0', '#fbcfe8', '#fbbf24']
    });
  }, [isDeckFinished, totalCards, celebrate]);

  // ---------- Desbloqueo ----------

  const unlockTimerRef = useRef(null);

  useEffect(() => {
    if (isUnlocked) return undefined;
    const timer = setTimeout(() => pinInputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [isUnlocked]);

  useEffect(() => () => clearTimeout(unlockTimerRef.current), []);

  const handleUnlockSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinCode.trim() !== SECRET_UNLOCK_CODE) {
      setHasError(true);
      setTimeout(() => setHasError(false), 800);
      return;
    }

    setIsUnlocking(true);
    setHasError(false);
    celebrate({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#ff4770', '#ffd6e0', '#fbcfe8', '#fbbf24']
    });

    unlockTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(UNLOCKED_STORAGE_KEY, '1');
      } catch {
        /* si no se puede guardar, pedirá el código de nuevo la próxima vez */
      }
      setIsUnlocked(true);
    }, 500);
  };

  // ---------- Interacción ----------

  useEffect(() => {
    if (!isUnlocked) return undefined;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // La barra espaciadora también activa el botón que tenga el foco: sin
      // esto, con "Siguiente" enfocado, avanzaba dos cartas de una.
      if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, handleNext, handlePrev]);

  // Un swipe termina disparando también el click del elemento: se ignora el
  // click inmediatamente posterior a un arrastre para no avanzar dos veces.
  const draggedRef = useRef(false);

  const handleDragEnd = (e, { offset, velocity }) => {
    if (Math.abs(offset.x) > 6) {
      draggedRef.current = true;
      setTimeout(() => {
        draggedRef.current = false;
      }, 60);
    }
    if (offset.x < -45 || velocity.x < -250) {
      handleNext();
    } else if (offset.x > 45 || velocity.x > 250) {
      handlePrev();
    }
  };

  const handleCardActivate = () => {
    if (draggedRef.current) return;
    handleNext();
  };

  const cardVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        enter: { opacity: 0 },
        center: { opacity: 1, x: 0, rotate: 0, scale: 1, transition: { duration: 0.12 } },
        exit: { opacity: 0, transition: { duration: 0.08 } }
      };
    }
    return {
      enter: (dir) => ({
        x: dir > 0 ? 70 : -70,
        opacity: 0,
        rotate: dir > 0 ? 3 : -3,
        scale: 0.96
      }),
      center: {
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: {
          x: { type: 'spring', stiffness: 420, damping: 32 },
          opacity: { duration: 0.15 },
          scale: { duration: 0.15 },
          rotate: { duration: 0.15 }
        }
      },
      exit: (dir) => ({
        x: dir > 0 ? -70 : 70,
        opacity: 0,
        rotate: dir > 0 ? -3 : 3,
        scale: 0.96,
        transition: { duration: 0.12 }
      })
    };
  }, [prefersReducedMotion]);

  // ==========================================
  // PANTALLA PREVIA: "ES SORPRESA" 🤫🔒
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="romantic-card-scene">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`romantic-card unlock-card ${hasError ? 'shake-error' : ''}`}
        >
          <div className="romantic-card-inner-frame unlock-frame">
            <div className="romantic-card-top">
              <span className="romantic-card-brand">ES SORPRESA</span>
              <span className="romantic-card-top-spark" aria-hidden="true">🤫</span>
            </div>

            <div className="unlock-body">
              <div className="unlock-icon-wrapper" aria-hidden="true">
                {isUnlocking ? (
                  <Unlock size={34} className="unlock-icon-anim" color="#10b981" />
                ) : (
                  <Lock size={34} className="lock-icon-pulse" color="#ff4770" />
                )}
              </div>

              <h3 className="unlock-title">
                {isUnlocking ? '¡Desbloqueado!' : 'Sección Secreta'}
              </h3>

              <p className="unlock-desc">
                {isUnlocking
                  ? 'Abriendo el mazo especial...'
                  : 'Esta parte tiene algo preparado para nosotros. Ingresá el código para descubrirlo:'}
              </p>

              {!isUnlocking && (
                <form onSubmit={handleUnlockSubmit} className="unlock-form">
                  <label className="sr-only" htmlFor="cards-unlock-pin">
                    Código secreto
                  </label>
                  <div className="unlock-input-wrapper">
                    <KeyRound size={18} className="unlock-input-icon" aria-hidden="true" />
                    <input
                      id="cards-unlock-pin"
                      ref={pinInputRef}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      placeholder="Código secreto..."
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value);
                        if (hasError) setHasError(false);
                      }}
                      className={`unlock-pin-input ${hasError ? 'input-error' : ''}`}
                      autoComplete="off"
                      aria-invalid={hasError}
                      aria-describedby={hasError ? 'cards-unlock-error' : undefined}
                    />
                  </div>

                  {hasError && (
                    <motion.p
                      id="cards-unlock-error"
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="unlock-error-msg"
                    >
                      Código incorrecto... pedile la clave a Gonza 😜🔒
                    </motion.p>
                  )}

                  <button type="submit" className="unlock-submit-btn" disabled={!pinCode.trim()}>
                    <span>Desbloquear</span>
                    <Sparkles size={16} aria-hidden="true" />
                  </button>
                </form>
              )}
            </div>

            <div className="romantic-card-bottom">
              <span className="romantic-card-footer-spark" aria-hidden="true">✦</span>
              <span className="romantic-card-footer-tag">Gonza &amp; Juli 💌</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // EL MAZO
  // ==========================================
  const currentCategoryEmoji = currentCard ? CATEGORY_EMOJI[currentCard.category] || '✦' : '✦';

  return (
    <div className="romantic-card-scene">
      {/* Lector de pantalla: la carta viva se anuncia acá, fuera de la animación */}
      <p className="sr-only" aria-live="polite">
        {currentCard ? `Responde ${PLAYERS[turn]}. ${currentCard.text}` : ''}
      </p>

      <div className="romantic-card-stack-wrapper">
        <div className="romantic-card-layer layer-3" aria-hidden="true" />
        <div className="romantic-card-layer layer-2" aria-hidden="true" />
        <div className="romantic-card-layer layer-1" aria-hidden="true" />

        {isFilterEmpty || isDeckFinished ? (
          <div className="romantic-card empty-deck-card">
            <div className="romantic-card-inner-frame">
              <div className="romantic-card-top">
                <span className="romantic-card-brand">GONZA &amp; JULI</span>
                <span className="romantic-card-top-spark" aria-hidden="true">✦</span>
              </div>

              <div className="romantic-card-content">
                {isDeckFinished ? (
                  <div>
                    <p className="romantic-card-question">
                      Se terminaron las {totalCards} cartas del mazo.
                    </p>
                    <p className="empty-deck-note">
                      Las respondieron todas. Se pueden barajar de nuevo cuando quieran.
                    </p>
                  </div>
                ) : onlyFavorites ? (
                  <p className="romantic-card-question">
                    Todavía no guardaron ninguna carta como favorita.
                  </p>
                ) : (
                  <p className="romantic-card-question">No hay cartas para este filtro.</p>
                )}
              </div>

              <button
                type="button"
                className="romantic-card-reset-btn"
                onClick={isDeckFinished ? handleResetDeck : () => setOnlyFavorites(false)}
              >
                {isDeckFinished ? (
                  <>
                    <RotateCcw size={15} aria-hidden="true" />
                    <span>Barajar de nuevo</span>
                  </>
                ) : (
                  <span>Volver al mazo</span>
                )}
              </button>

              <div className="romantic-card-bottom">
                <span className="romantic-card-footer-spark" aria-hidden="true">✦</span>
                <span className="romantic-card-footer-tag">para conocernos más 💌</span>
              </div>
            </div>
          </div>
        ) : !currentCard ? null : (
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentCard.id}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={handleDragEnd}
              onClick={handleCardActivate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Carta actual. Activar para sacar la siguiente."
              className="romantic-card"
              title="Tocá la carta para sacar la siguiente"
            >
              <div className="romantic-card-inner-frame">
                <div className="romantic-card-top">
                  {/* El turno vive en la carta: es lo primero que miran al
                      darla vuelta. Se puede tocar para corregirlo sin que eso
                      cuente como pasar de carta. */}
                  <button
                    type="button"
                    className="romantic-card-turn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTurn((prev) => 1 - prev);
                    }}
                    title="Tocá para cambiar el turno"
                  >
                    Responde {PLAYERS[turn]}
                  </button>
                  <span className="romantic-card-top-spark" aria-hidden="true">
                    {currentCategoryEmoji}
                  </span>
                </div>

                <div className="romantic-card-content">
                  <p className="romantic-card-question">{currentCard.text}</p>
                </div>

                <div className="romantic-card-bottom">
                  <span className="romantic-card-footer-spark" aria-hidden="true">✦</span>
                  <span className="romantic-card-footer-tag">para conocernos más 💌</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="romantic-card-controls">
        <button
          type="button"
          onClick={handlePrev}
          className="romantic-control-btn icon-only"
          aria-label="Volver a la carta anterior"
          title="Carta anterior"
          disabled={history.length === 0}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleShuffle}
          className="romantic-control-btn shuffle"
          aria-label="Mezclar las cartas que quedan y sacar otra"
          title="Mezclar lo que queda y sacar otra"
          disabled={!currentCard || queue.length === 0}
        >
          <Shuffle size={17} aria-hidden="true" />
          <span className="control-label">Mezclar</span>
        </button>

        <button
          type="button"
          onClick={toggleFavorite}
          className={`romantic-control-btn favorite ${isFavorite ? 'active' : ''}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Quitar de favoritas' : 'Guardar en favoritas'}
          title={isFavorite ? 'Quitar de favoritas' : 'Guardar en favoritas'}
          disabled={!currentCard}
        >
          <Heart
            size={18}
            aria-hidden="true"
            fill={isFavorite ? '#ff4770' : 'none'}
            color={isFavorite ? '#ff4770' : 'currentColor'}
          />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="romantic-control-btn primary"
          aria-label="Sacar la siguiente carta"
          title="Siguiente carta"
          disabled={!currentCard}
        >
          <span className="control-label">Siguiente</span>
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>

      {/* Todo lo que no es la carta se dice en voz baja, en una sola línea. */}
      <div className="cards-whisper-row">
        <span className="cards-whisper-count">
          {onlyFavorites ? `${totalCards} favoritas` : `${playedCount} de ${totalCards}`}
        </span>

        {favorites.length > 0 && (
          <button
            type="button"
            className={`cards-whisper-btn ${onlyFavorites ? 'active' : ''}`}
            onClick={handleToggleFavoritesView}
            aria-pressed={onlyFavorites}
          >
            {onlyFavorites ? 'Volver al mazo' : `Favoritas (${favorites.length})`}
          </button>
        )}

        {!onlyFavorites && playedCount > 0 && !isDeckFinished && (
          <button type="button" className="cards-whisper-btn" onClick={handleResetDeck}>
            Empezar de nuevo
          </button>
        )}
      </div>

      {isSupabaseConfigured && syncState === 'local' && (
        <p className="cards-sync-note">
          El progreso y las favoritas se están guardando sólo en este equipo.
        </p>
      )}
    </div>
  );
};

export default CardsModule;
