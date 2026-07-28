import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const DateTypeStep = ({ onNext, onBack, selectedOption, setSelectedOption, customNote, setCustomNote }) => {
  const selectOption = (id) => {
    setSelectedOption(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="disney-card"
      style={{ position: 'relative' }}
    >
      {/* Flecha Volver Atrás */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: '#fff0f3',
          border: '1px solid #ffccd5',
          borderRadius: '50%',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--primary-pink)',
          zIndex: 10
        }}
        title="Volver atrás"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="step-indicator">
        <div className="dot-step"></div>
        <div className="dot-step active"></div>
        <div className="dot-step"></div>
      </div>

      <span className="disney-title-accent">Primer paso...</span>
      <h2 className="disney-title-serif">Elegí tu plan ✨</h2>
      <p className="disney-subtitle">Seleccioná la opción que más te tiente</p>

      {/* Lista de Opciones Compactas y Elegantes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.1rem' }}>
        {DATE_CONFIG.dateOptions.map((opt) => {
          const isSelected = selectedOption === opt.id;

          return (
            <motion.div
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectOption(opt.id)}
              style={{
                background: isSelected ? 'linear-gradient(135deg, #fff2f5 0%, #ffe6eb 100%)' : '#ffffff',
                border: isSelected ? '2px solid var(--primary-pink)' : '1.5px solid #ffe0e6',
                borderRadius: '16px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 14px rgba(255, 92, 138, 0.18)' : '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', textAlign: 'left' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: opt.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}
                >
                  {opt.emoji}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.94rem', color: 'var(--text-main)', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
                    {opt.title}
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>
                    {opt.subtitle}
                  </p>
                </div>
              </div>

              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid #e0e0e0',
                  background: isSelected ? 'var(--primary-pink)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detalle Opcional */}
      <div style={{ textAlign: 'left', marginBottom: '1.1rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
          ¿Algún detalle o lugar extra? ✨ (Opcional)
        </label>
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="Ej: Ir a un lugar tranquilo, tomar un té helado..."
          style={{
            width: '100%',
            padding: '0.55rem 0.85rem',
            borderRadius: '14px',
            border: '1.5px solid #ffccd5',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            background: 'white'
          }}
        />
      </div>

      {/* Botones de Navegación A la Vista */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          onClick={onBack}
          className="btn-disney-secondary"
          style={{ width: '32%', padding: '0.72rem 0.5rem', fontSize: '0.88rem' }}
        >
          <ArrowLeft size={15} inline style={{ marginRight: '3px' }} />
          Atrás
        </button>

        <button
          onClick={onNext}
          disabled={!selectedOption}
          className="btn-disney-primary"
          style={{
            width: '68%',
            padding: '0.72rem 1rem',
            fontSize: '0.95rem',
            opacity: !selectedOption ? 0.5 : 1,
            cursor: !selectedOption ? 'not-allowed' : 'pointer'
          }}
        >
          <span>Elegir fecha</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default DateTypeStep;
