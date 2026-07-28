import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Calendar, Clock, CheckCircle2, Ticket, HeartHandshake, ArrowLeft } from 'lucide-react';
import { DATE_CONFIG } from '../config/dateConfig';

const ConfirmationStep = ({ onBack, selectedOption, selectedDate, selectedTime, customNote }) => {
  const [isSending, setIsSending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ff4770', '#ffb3ba', '#ffd700', '#b5ead7']
    });
  }, []);

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const chosenOptionObj = DATE_CONFIG.dateOptions.find((opt) => opt.id === selectedOption);
  const chosenOptionText = chosenOptionObj ? `${chosenOptionObj.emoji} ${chosenOptionObj.title}` : '';

  const getChosenTimeText = () => {
    const allSlots = [...DATE_CONFIG.timeSlotsWeekdays, ...DATE_CONFIG.timeSlotsWeekends];
    const found = allSlots.find((t) => t.id === selectedTime);
    return found ? `${found.label.split(' ')[0]} (${found.time})` : selectedTime;
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#ff2a5a', '#ff4770', '#ffd700']
    });
  };

  // Enviar confirmación por correo de forma silenciosa en segundo plano sin abrir Outlook ni mailto
  const handleConfirm = async () => {
    triggerCelebration();
    setIsSending(true);

    const formattedDate = getFormattedDate(selectedDate);
    const timeText = getChosenTimeText();

    const emailSubject = `¡Cita Confirmada! 💕 - ${chosenOptionText}`;
    const emailBody = `¡Hola Gonzalo!\n\n` +
      `¡Acepté la propuesta de cita para cuando me recupere! 🥰✨\n\n` +
      `📌 Plan elegido: ${chosenOptionText}\n` +
      `📅 Fecha tentativa: ${formattedDate}\n` +
      `⏰ Horario: ${timeText}\n` +
      (customNote ? `💡 Detalle: "${customNote}"\n` : '') +
      `\n¡Nos vemos apenas esté de 10! ✨`;

    const endpoint = DATE_CONFIG.formSubmitToken || DATE_CONFIG.emailAddress;

    try {
      // Envío automático silencioso vía FormSubmit AJAX
      await fetch(`https://formsubmit.co/ajax/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: emailSubject,
          Para: DATE_CONFIG.fromName,
          Plan: chosenOptionText,
          Fecha: formattedDate,
          Horario: timeText,
          Detalle: customNote || 'Sin notas extra',
          Mensaje: emailBody
        })
      });
    } catch (err) {
      console.log('Envío completado:', err);
    } finally {
      // Importante: NO abrimos mailto ni Outlook físicamente
      setIsSending(false);
      setIsConfirmed(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="disney-card"
      style={{ position: 'relative' }}
    >
      {/* Flecha Volver Atrás */}
      {!isConfirmed && (
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
          title="Cambiar fecha o plan"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <motion.div
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        style={{ display: 'inline-block', marginBottom: '0.4rem' }}
      >
        <Sparkles size={44} color="#ffd700" fill="#ffd700" />
      </motion.div>

      <span className="disney-title-accent">¡Buenísimo!</span>
      <h1 className="disney-title-serif">Resumen del Plan ✨</h1>
      <p className="disney-subtitle"></p>

      {/* Ticket Resumen */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fff0f4 0%, #ffe8ee 100%)',
          borderRadius: '22px',
          padding: '1.3rem 1.1rem',
          border: '1.5px dashed var(--primary-pink)',
          boxShadow: '0 8px 20px rgba(255, 71, 112, 0.15)',
          textAlign: 'left',
          marginBottom: '1.4rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', borderBottom: '1px solid rgba(255, 71, 112, 0.2)', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Ticket size={18} color="var(--primary-pink)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary-pink)', fontSize: '0.84rem', letterSpacing: '0.5px' }}>
              NUESTRA PRIMERA CITA
            </span>
          </div>
          <HeartHandshake size={18} color="var(--primary-pink)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLAN ELEGIDO:</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {chosenOptionText}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> FECHA:
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {getFormattedDate(selectedDate)}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> HORARIO:
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {getChosenTimeText()}
              </div>
            </div>
          </div>

          {customNote && (
            <div style={{ marginTop: '0.2rem', background: '#fff', padding: '0.6rem', borderRadius: '12px', border: '1px solid #ffd3e2' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--primary-pink)', fontWeight: 700 }}>Detalle especial: ✨</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0 }}>
                "{customNote}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      {!isConfirmed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleConfirm}
            disabled={isSending}
            className="btn-disney-primary"
            style={{
              background: 'linear-gradient(135deg, #ff2a5a 0%, #ff4770 100%)',
              boxShadow: '0 8px 25px rgba(255, 42, 90, 0.4)'
            }}
          >
            <span>{isSending ? 'Confirmando...' : '¡Confirmar! ✨'}</span>
          </motion.button>

          <button
            onClick={onBack}
            className="btn-disney-secondary"
            style={{ marginTop: 0 }}
          >
            <ArrowLeft size={16} inline style={{ marginRight: '4px' }} />
            Cambiar fecha o plan
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '18px',
            padding: '1.1rem 1rem',
            color: '#166534',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '1.05rem',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.15)'
          }}
        >
          <CheckCircle2 size={24} color="#16a34a" />
          <span>¡Listo! Nos vemos pronto ✨</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ConfirmationStep;
