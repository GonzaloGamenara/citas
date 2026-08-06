import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trash2, MapPin, CheckCircle2, Bookmark } from 'lucide-react';

const INITIAL_WISHLIST = [
  {
    id: 'wish-1',
    title: 'Muestra inmersiva en el MALBA',
    category: 'museo',
    categoryName: 'Museo / Arte',
    emoji: '🎨',
    location: 'MALBA, Palermo',
    notes: 'Ir una tarde de lluvia y tomar un café en el patio del museo.'
  },
  {
    id: 'wish-2',
    title: 'Obra de teatro en el San Martín o Timbre 4',
    category: 'teatro',
    categoryName: 'Teatro',
    emoji: '🎭',
    location: 'Teatro San Martín / San Telmo',
    notes: 'Ver una obra independiente de noche y cenar en San Telmo.'
  },
  {
    id: 'wish-3',
    title: 'Café helado en Paul French Gallery',
    category: 'cafe',
    categoryName: 'Café & Merienda',
    emoji: '☕',
    location: 'Palermo Soho',
    notes: 'Probar las tortas artesanales y sacar lindas fotos en el callejón.'
  }
];

const WishlistModule = ({ wishlist, onAddWish, onDeleteWish, onConvertToDate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('cafe');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddWish({
      id: `wish-${Date.now()}`,
      title: title.trim(),
      location: location.trim() || 'CABA',
      category: category,
      emoji: category === 'teatro' ? '🎭' : category === 'museo' ? '🏛️' : category === 'vino' ? '🍷' : category === 'cine' ? '🎬' : '☕',
      notes: notes.trim()
    });

    setTitle('');
    setLocation('');
    setNotes('');
    setIsAdding(false);
  };

  const handleCompleteItem = (item) => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff4770', '#ffd700', '#86efac']
    });

    onConvertToDate(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="disney-card wishlist-container"
    >
      <div className="wishlist-header">
        <div>
          <span className="disney-title-accent">Bucket List de Pareja</span>
          <h2 className="disney-title-serif" style={{ margin: 0 }}>Lugares por Conocer 📝</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-add-date"
        >
          <Plus size={16} />
          <span>{isAdding ? 'Cerrar' : 'Agregar'}</span>
        </button>
      </div>

      {/* Formulario Agregar Pendiente */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="wishlist-form-card"
          >
            <h4 className="wishlist-form-title">✨ Guardar Lugar o Plan Pendiente</h4>

            <div className="form-group">
              <label className="form-label">Nombre del Lugar o Plan *</label>
              <input
                type="text"
                required
                placeholder="Ej: Probar café en Cuervo Café, ir al Teatro Colón..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Zona / Barrio</label>
                <input
                  type="text"
                  placeholder="Ej: Palermo, San Telmo, Recoleta"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  style={{ background: 'white' }}
                >
                  <option value="cafe">☕ Café / Merienda</option>
                  <option value="teatro">🎭 Teatro / Show</option>
                  <option value="museo">🏛️ Museo / Arte</option>
                  <option value="vino">🍷 Vino / Bar</option>
                  <option value="cine">🎬 Cine</option>
                  <option value="paseo">🌳 Paseo / Plaza</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detalles o Por qué queremos ir</label>
              <input
                type="text"
                placeholder="Ej: Vimos una recomendación re linda en Instagram..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-disney-primary" style={{ marginTop: '0.4rem' }}>
              <span>Guardar en Pendientes</span>
              <Bookmark size={16} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Lista de Pendientes */}
      <div className="wishlist-stack">
        {wishlist.length === 0 ? (
          <div className="empty-history-state">
            <span className="empty-emoji">📝</span>
            <p>Aún no hay lugares en la lista de pendientes.</p>
          </div>
        ) : (
          wishlist.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.01 }}
              className="wishlist-item-card"
            >
              <div className="wishlist-emoji-box">
                {item.emoji || '📌'}
              </div>

              <div className="wishlist-item-info">
                <h4 className="wishlist-item-title">{item.title}</h4>
                {item.location && (
                  <div className="wishlist-item-meta">
                    <MapPin size={12} /> {item.location}
                  </div>
                )}
                {item.notes && (
                  <p className="wishlist-item-notes">"{item.notes}"</p>
                )}
              </div>

              <div className="wishlist-actions">
                <button
                  onClick={() => handleCompleteItem(item)}
                  className="btn-mark-done"
                  title="Marcar como realizado y mover a Nuestras Citas"
                >
                  <CheckCircle2 size={16} />
                  <span>¡Ya fuimos!</span>
                </button>

                <button
                  onClick={() => onDeleteWish(item.id)}
                  className="btn-delete-wish"
                  title="Eliminar de pendientes"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default WishlistModule;
export { INITIAL_WISHLIST };
