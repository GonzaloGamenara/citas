import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trash2, MapPin, CheckCircle2, Bookmark, Pencil, X, Sparkles, Gift, Clock, Lock } from 'lucide-react';
import CategoryPicker from './CategoryPicker';
import { categoryEmoji } from '../data/categories';
import { isSurpriseLocked, prettySurpriseDate, countdownLabel } from '../utils/surprise';
import { getTodayLocalISO } from '../utils/dateUtils';

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

const WishlistModule = ({
  wishlist,
  onAddWish,
  onEditWish,
  onDeleteWish,
  onConvertToDate,
  identity,
  customCategories = [],
  onAddCustomCategory
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form para agregar
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('cafe');
  const [notes, setNotes] = useState('');

  // Sorpresa: el otro ve que hay algo preparado, con día, duración y unas
  // pistas, pero no qué es. Se destapa solo cuando llega la fecha.
  const [isSurprise, setIsSurprise] = useState(false);
  const [surpriseDate, setSurpriseDate] = useState(getTodayLocalISO());
  const [surpriseDuration, setSurpriseDuration] = useState('2 hs');
  const [hintEmojis, setHintEmojis] = useState('');

  // Form para editar
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState('cafe');
  const [editNotes, setEditNotes] = useState('');

  // Antes era un switch que sólo conocía 7 categorías y devolvía ☕ para el
  // resto: elegir "Helado" te guardaba un café. Ahora sale de la lista real,
  // que además incluye las categorías propias.
  const getEmojiForCategory = (cat) => categoryEmoji(cat, customCategories);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddWish({
      id: `wish-${Date.now()}`,
      title: title.trim(),
      location: location.trim() || 'CABA',
      category: category,
      emoji: getEmojiForCategory(category),
      notes: notes.trim(),
      isSurprise,
      surpriseDate: isSurprise ? surpriseDate : null,
      surpriseDuration: isSurprise ? surpriseDuration : '',
      hintEmojis: isSurprise ? hintEmojis.trim() : ''
    });

    setTitle('');
    setLocation('');
    setNotes('');
    setIsSurprise(false);
    setHintEmojis('');
    setSurpriseDate(getTodayLocalISO());
    setSurpriseDuration('2 hs');
    setIsAdding(false);
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditLocation(item.location || '');
    setEditCategory(item.category || 'cafe');
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingItem) return;

    if (onEditWish) {
      onEditWish({
        ...editingItem,
        title: editTitle.trim(),
        location: editLocation.trim() || 'CABA',
        category: editCategory,
        emoji: getEmojiForCategory(editCategory),
        notes: editNotes.trim()
      });
    }

    setEditingItem(null);
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
          <span className="disney-title-accent">Bucket List</span>
          <h2 className="disney-title-serif" style={{ margin: 0 }}>Lugares por Conocer 📝</h2>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingItem(null);
          }}
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

            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <CategoryPicker
                value={category}
                onChange={setCategory}
                customCategories={customCategories}
                onAddCustomCategory={onAddCustomCategory}
                multiple={false}
              />
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

            <button
              type="button"
              className={`surprise-toggle ${isSurprise ? 'active' : ''}`}
              onClick={() => setIsSurprise((v) => !v)}
              aria-pressed={isSurprise}
            >
              <Gift size={16} aria-hidden="true" />
              <span className="surprise-toggle-text">
                <strong>Que sea sorpresa</strong>
                <small>
                  Le llega el aviso con el día, la duración y las pistas — pero no qué es.
                </small>
              </span>
              <span className={`surprise-switch ${isSurprise ? 'on' : ''}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
              {isSurprise && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="surprise-fields"
                >
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">¿Qué día?</label>
                      <input
                        type="date"
                        value={surpriseDate}
                        min={getTodayLocalISO()}
                        onChange={(e) => setSurpriseDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">¿Cuánto dura?</label>
                      <input
                        type="text"
                        placeholder="Ej: 3 hs"
                        value={surpriseDuration}
                        onChange={(e) => setSurpriseDuration(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pistas (2 o 3 emojis)</label>
                    <input
                      type="text"
                      placeholder="🌃 🍷 🎂"
                      value={hintEmojis}
                      onChange={(e) => setHintEmojis(e.target.value)}
                      className="form-input surprise-hints-input"
                    />
                    <span className="form-hint">
                      Es lo único que va a ver hasta ese día. Que digan algo, pero no todo.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="btn-disney-primary" style={{ marginTop: '0.4rem' }}>
              <span>{isSurprise ? 'Guardar la sorpresa' : 'Guardar en Pendientes'}</span>
              {isSurprise ? <Gift size={16} /> : <Bookmark size={16} />}
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
          wishlist.map((item) => {
            const locked = isSurpriseLocked(item, identity);

            // Tapada: sólo el envoltorio. Ni título, ni lugar, ni notas —
            // y tampoco los botones de editar o "ya fuimos", que arruinarían
            // la sorpresa antes de tiempo.
            if (locked) {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="wishlist-item-card surprise-locked-card"
                >
                  <div className="wishlist-emoji-box surprise-gift-box">
                    <Gift size={20} aria-hidden="true" />
                  </div>

                  <div className="wishlist-item-info">
                    <h4 className="wishlist-item-title">Hay algo preparado</h4>

                    <div className="surprise-locked-meta">
                      <span>
                        <Clock size={12} aria-hidden="true" />{' '}
                        {prettySurpriseDate(item.surpriseDate)}
                      </span>
                      {item.surpriseDuration && <span>· {item.surpriseDuration}</span>}
                    </div>

                    {item.hintEmojis && (
                      <div className="surprise-hints" aria-label="Pistas">
                        {item.hintEmojis}
                      </div>
                    )}

                    <p className="surprise-locked-note">
                      <Lock size={11} aria-hidden="true" /> Se destapa solo ese día
                      {item.surpriseDate ? ` — ${countdownLabel(item.surpriseDate)}` : ''}.
                    </p>
                  </div>
                </motion.div>
              );
            }

            return (
            <React.Fragment key={item.id}>
              {editingItem?.id === item.id ? (
                <motion.form
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onSubmit={handleSaveEdit}
                  className="wishlist-form-card editing-card"
                  style={{ marginBottom: '0.8rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="wishlist-form-title">✏️ Editar Pendiente</h4>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="modal-close-btn"
                      style={{ width: 24, height: 24 }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nombre del Lugar o Plan *</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label className="form-label">Zona / Barrio</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label className="form-label">Categoría</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
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
                    <label className="form-label">Detalles o Notas</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn-disney-secondary"
                      onClick={() => setEditingItem(null)}
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-disney-primary"
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      <span>Guardar</span>
                      <Sparkles size={14} />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="wishlist-item-card"
                >
                  <div className="wishlist-emoji-box">
                    {item.emoji || '📌'}
                  </div>

                  <div className="wishlist-item-info">
                    <h4 className="wishlist-item-title">
                      {item.title}
                      {/* El autor sí ve el contenido, pero conviene recordarle
                          que del otro lado todavía está envuelto. */}
                      {item.isSurprise && (
                        <span className="surprise-badge">
                          <Gift size={10} aria-hidden="true" />
                          {countdownLabel(item.surpriseDate) === 'ya pasó'
                            ? 'destapada'
                            : 'sorpresa'}
                        </span>
                      )}
                    </h4>
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
                      onClick={() => startEditing(item)}
                      className="btn-edit-wish"
                      title="Editar este pendiente"
                    >
                      <Pencil size={14} />
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
              )}
            </React.Fragment>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default WishlistModule;
export { INITIAL_WISHLIST };
