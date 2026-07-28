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
      style={{ position: 'relative', padding: '1rem 0.9rem' }}
    >
      {/* Flecha Volver Atrás */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '0.8rem',
          left: '0.8rem',
          background: '#fff0f3',
          border: '1px solid #ffccd5',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
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

      <div className="step-indicator" style={{ marginBottom: '0.5rem' }}>
        <div className="dot-step"></div>
        <div className="dot-step active"></div>
        <div className="dot-step"></div>
      </div>

      <span className="disney-title-accent" style={{ fontSize: '1.75rem' }}>Primer paso...</span>
      <h2 className="disney-title-serif" style={{ fontSize: '1.35rem', marginBottom: '0.15rem' }}>Elegí tu plan ✨</h2>
      <p className="disney-subtitle" style={{ marginBottom: '0.6rem', fontSize: '0.8rem' }}>Seleccioná la opción que más te tiente</p>

      {/* Lista de Opciones Compactas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.7rem' }}>
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
                borderRadius: '14px',
                padding: '0.55rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 14px rgba(255, 92, 138, 0.18)' : '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textAlign: 'left' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: opt.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    flexShrink: 0
                  }}
                >
                  {opt.emoji}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.92rem', color: 'var(--text-main)', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
                    {opt.title}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>
                    {opt.subtitle}
                  </p>
                </div>
              </div>

              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid #e0e0e0',
                  background: isSelected ? 'var(--primary-pink)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isSelected && <Check size={13} color="white" strokeWidth={3} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detalle Opcional en 1 Sola Línea Compacta */}
      <div style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
          ¿Algún detalle o lugar extra? ✨ (Opcional)
        </label>
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="Ej: Ir a un lugar tranquilo..."
          style={{
            width: '100%',
            padding: '0.45rem 0.75rem',
            borderRadius: '12px',
            border: '1.5px solid #ffccd5',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            background: 'white'
          }}
        />
      </div>

      {/* Botones de Navegación Accesibles de un Vistazo sin Scroll */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          onClick={onBack}
          className="btn-disney-secondary"
          style={{ width: '32%', padding: '0.65rem 0.5rem', fontSize: '0.86rem' }}
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
            padding: '0.65rem 1rem',
            fontSize: '0.92rem',
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
