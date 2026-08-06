import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles, MapPin, Plus, BookmarkCheck, ExternalLink, Map,
  Wallet, Clock, CalendarCheck, Ticket, Lightbulb
} from 'lucide-react';
import { CABA_PLANS, PLAN_CATEGORIES, getMapsUrl } from '../data/cabaPlans';

const CabaEventsModule = ({ onAddToWishlist }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(CABA_PLANS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [addedIds, setAddedIds] = useState([]);
  const spinIntervalRef = useRef(null);

  const filteredPlans = useMemo(
    () => (selectedCategory === 'all'
      ? CABA_PLANS
      : CABA_PLANS.filter((p) => p.category === selectedCategory)),
    [selectedCategory]
  );

  // Cuántos planes hay por categoría, para mostrarlo en los filtros
  const countsByCategory = useMemo(() => {
    const counts = { all: CABA_PLANS.length };
    CABA_PLANS.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Si se cambia de pestaña con la ruleta girando, el intervalo debe cortarse
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const spinRoulette = () => {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

    setIsSpinning(true);
    let count = 0;
    const pool = filteredPlans.length > 0 ? filteredPlans : CABA_PLANS;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setSelectedPlan(pool[randomIdx]);
      count++;
      if (count > 12) {
        clearInterval(interval);
        spinIntervalRef.current = null;
        setIsSpinning(false);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff4770', '#ffd700', '#86efac']
        });
      }
    }, 90);

    spinIntervalRef.current = interval;
  };

  const handleAddWish = (plan) => {
    const fuente = plan.link
      ? `\n🔗 ${plan.sourceName}: ${plan.link}`
      : `\n🗺️ ${getMapsUrl(plan)}`;

    onAddToWishlist({
      id: `wish-caba-${Date.now()}`,
      title: plan.title,
      location: `${plan.address} — ${plan.neighborhood}`,
      category: plan.category,
      emoji: plan.emoji,
      notes: `${plan.description}\n\n💰 ${plan.price} · ⏱ ${plan.duration}${fuente}`
    });
    setAddedIds((prev) => [...prev, plan.id]);
  };

  const categoryName = (id) =>
    PLAN_CATEGORIES.find((c) => c.id === id)?.name || id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card caba-roulette-container"
    >
      <span className="disney-title-accent">Qué hacer en Buenos Aires</span>
      <h2 className="disney-title-serif">Agenda CABA 🎡</h2>
      <p className="disney-subtitle">
        {CABA_PLANS.length} planes con dirección, precio y enlace al lugar
      </p>

      {/* Filtros por categoría */}
      <div className="caba-category-filter">
        {PLAN_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`filter-tag ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.emoji} {cat.name} ({countsByCategory[cat.id] || 0})
          </button>
        ))}
      </div>

      <button
        onClick={spinRoulette}
        disabled={isSpinning}
        className="btn-disney-primary btn-spin-roulette"
      >
        <Sparkles size={18} />
        <span>{isSpinning ? 'Girando la ruleta...' : '¡Girar ruleta CABA 🎰!'}</span>
      </button>

      {/* Plan destacado con toda la info concreta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlan.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="roulette-result-card"
        >
          <div className="roulette-badge">
            <span>{selectedPlan.emoji} {categoryName(selectedPlan.category).toUpperCase()}</span>
          </div>

          <h3 className="roulette-result-title">{selectedPlan.title}</h3>

          <div className="roulette-location-tag">
            <MapPin size={13} color="var(--primary-pink)" />
            <span>{selectedPlan.address} · {selectedPlan.neighborhood}</span>
          </div>

          <p className="roulette-result-desc">{selectedPlan.description}</p>

          {/* Datos duros: se acabó la ambigüedad */}
          <div className="plan-details-grid">
            <div className="plan-detail-row">
              <Wallet size={13} className="plan-detail-icon" />
              <div>
                <span className="plan-detail-label">Precio</span>
                <span className="plan-detail-value">{selectedPlan.price}</span>
              </div>
            </div>
            <div className="plan-detail-row">
              <Clock size={13} className="plan-detail-icon" />
              <div>
                <span className="plan-detail-label">Duración</span>
                <span className="plan-detail-value">{selectedPlan.duration}</span>
              </div>
            </div>
            <div className="plan-detail-row">
              <CalendarCheck size={13} className="plan-detail-icon" />
              <div>
                <span className="plan-detail-label">Cuándo ir</span>
                <span className="plan-detail-value">{selectedPlan.bestTime}</span>
              </div>
            </div>
            <div className="plan-detail-row">
              <Ticket size={13} className="plan-detail-icon" />
              <div>
                <span className="plan-detail-label">Reserva</span>
                <span className="plan-detail-value">{selectedPlan.booking}</span>
              </div>
            </div>
          </div>

          {selectedPlan.tip && (
            <div className="plan-tip-box">
              <Lightbulb size={13} className="plan-detail-icon" />
              <span>{selectedPlan.tip}</span>
            </div>
          )}

          <div className="roulette-card-actions">
            {/* Sitio oficial: sólo si el plan tiene una fuente propia verificada */}
            {selectedPlan.link && (
              <a
                href={selectedPlan.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-source-link"
              >
                <ExternalLink size={15} />
                <span>Ir a {selectedPlan.sourceName}</span>
              </a>
            )}

            {/* Google Maps: siempre disponible, no depende de ningún sitio */}
            <a
              href={getMapsUrl(selectedPlan)}
              target="_blank"
              rel="noopener noreferrer"
              className={selectedPlan.link ? 'btn-maps-link' : 'btn-source-link'}
            >
              <Map size={15} />
              <span>Ver en Google Maps</span>
            </a>

            {addedIds.includes(selectedPlan.id) ? (
              <div className="btn-added-success">
                <BookmarkCheck size={16} />
                <span>¡Agregado a Pendientes!</span>
              </div>
            ) : (
              <button
                onClick={() => handleAddWish(selectedPlan)}
                className="btn-disney-secondary"
              >
                <Plus size={16} />
                <span>Agregar a Pendientes</span>
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Catálogo completo */}
      <div className="caba-plans-grid">
        <h4 className="caba-grid-subtitle">
          {selectedCategory === 'all'
            ? 'Todos los planes'
            : `${categoryName(selectedCategory)} (${filteredPlans.length})`}
        </h4>

        <div className="caba-cards-stack">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`caba-mini-card ${selectedPlan.id === plan.id ? 'active' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <span className="caba-mini-emoji">{plan.emoji}</span>

              <div className="caba-mini-info">
                <h5 className="caba-mini-title">{plan.title}</h5>
                <span className="caba-mini-loc">
                  📍 {plan.neighborhood}{plan.sourceName ? ` · ${plan.sourceName}` : ''}
                </span>
                <div className="caba-mini-meta">
                  <span className="caba-mini-chip">{plan.price}</span>
                  <span className="caba-mini-chip">{plan.duration}</span>
                </div>
              </div>

              <div className="caba-mini-actions">
                {plan.link && (
                  <a
                    href={plan.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="caba-mini-link"
                    title={`Abrir ${plan.sourceName}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <a
                  href={getMapsUrl(plan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="caba-mini-link maps"
                  title="Ver en Google Maps"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Map size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CabaEventsModule;
