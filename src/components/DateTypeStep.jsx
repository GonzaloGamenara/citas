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
      {/* Flecha Volver Atrás arriba a la izquierda */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '1.2rem',
          left: '1.2rem',
          background: '#fff0f3',
          border: '1px solid #ffccd5',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--primary-pink)',
          zIndex: 10
        }}
        title="Volver atrás"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="step-indicator">
        <div className="dot-step"></div>
        <div className="dot-step active"></div>
        <div className="dot-step"></div>
      </div>

      <span className="disney-title-accent">Primer paso...</span>
      <h2 className="disney-title-serif">Elegí tu plan ✨</h2>
      <p className="disney-subtitle">Seleccioná la opción que más te tiente</p>

      {/* Lista de Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.2rem' }}>
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
                borderRadius: '18px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 6px 18px rgba(255, 92, 138, 0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textAlign: 'left' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: opt.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}
                >
                  {opt.emoji}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.02rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                    {opt.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
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
                  justifyContent: 'center'
                }}
              >
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detalle o Antojo Opcional */}
      <div style={{ textAlign: 'left', marginBottom: '1.3rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
          ¿Algún detalle o lugar que quieras agregar? ✨ (Opcional)
        </label>
        <textarea
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="Ej: Ir a un lugar tranquilo, tomar un té helado..."
          rows={2}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: '14px',
            border: '1.5px solid #ffccd5',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            resize: 'none',
            background: 'white'
          }}
        />
      </div>

      {/* Botones de Navegación */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onBack}
          className="btn-disney-secondary"
          style={{ width: '35%', marginTop: 0 }}
        >
          <ArrowLeft size={16} inline style={{ marginRight: '4px' }} />
          Atrás
        </button>

        <button
          onClick={onNext}
          disabled={!selectedOption}
          className="btn-disney-primary"
          style={{
            width: '65%',
            opacity: !selectedOption ? 0.5 : 1,
            cursor: !selectedOption ? 'not-allowed' : 'pointer'
          }}
        >
          <span>Elegir fecha</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default DateTypeStep;
