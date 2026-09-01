import React from 'react';
import { motion } from 'framer-motion';
import { PEOPLE } from '../utils/identity';

/**
 * Primera pantalla en un dispositivo nuevo: ¿quién sos?
 *
 * Se pregunta una sola vez y queda guardado. No es un login — no hay nada que
 * proteger acá — es para que la app sepa a quién avisarle cuando el otro
 * agrega una cita o un pendiente.
 */
const IdentityGate = ({ onChoose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="disney-card identity-gate"
    >
      <span className="disney-title-accent">Antes de entrar</span>
      <h2 className="disney-title-serif">¿Quién sos?</h2>

      <p className="identity-gate-desc">
        Es para saber a quién avisarle cuando el otro agrega algo. Se pregunta
        una sola vez.
      </p>

      <div className="identity-gate-options">
        {PEOPLE.map((person) => (
          <button
            key={person.id}
            type="button"
            className="identity-gate-btn"
            onClick={() => onChoose(person.id)}
          >
            <span className="identity-gate-emoji" aria-hidden="true">
              {person.emoji}
            </span>
            <span className="identity-gate-name">Soy {person.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default IdentityGate;
