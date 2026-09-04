import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { allCategories, makeCategoryId } from '../data/categories';

/** Atajos para no pelear con el teclado de emojis del teléfono. */
const EMOJI_SUGGESTIONS = ['🎡', '🏖️', '🎳', '🚲', '🍣', '🥐', '🎤', '🐶', '📚', '🎨', '⚽', '🌙'];

/**
 * Chips de categorías, con la posibilidad de inventar una nueva.
 *
 * Sirve tanto para citas (varias a la vez) como para pendientes (una sola),
 * según `multiple`.
 */
const CategoryPicker = ({
  value,
  onChange,
  customCategories = [],
  onAddCustomCategory,
  multiple = true
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const nameInputRef = useRef(null);

  const options = allCategories(customCategories);
  const selected = multiple ? value : [value].filter(Boolean);

  useEffect(() => {
    if (isCreating) nameInputRef.current?.focus();
  }, [isCreating]);

  const toggle = (catId) => {
    if (!multiple) {
      onChange(catId);
      return;
    }
    onChange(
      selected.includes(catId) ? selected.filter((c) => c !== catId) : [...selected, catId]
    );
  };

  const resetForm = () => {
    setName('');
    setEmoji('');
    setIsCreating(false);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cleanName = name.trim();
    // El emoji puede ocupar varios code points (banderas, familias): se toma
    // el primer grafema, no el primer carácter.
    const cleanEmoji = [...emoji.trim()][0] ? Array.from(emoji.trim()).slice(0, 3).join('') : '';
    if (!cleanName || !cleanEmoji) return;

    const category = {
      id: makeCategoryId(cleanName, customCategories),
      name: cleanName,
      emoji: cleanEmoji
    };

    onAddCustomCategory?.(category);
    // Queda elegida de una: si la acabás de crear, la querés usar.
    if (multiple) onChange([...selected, category.id]);
    else onChange(category.id);
    resetForm();
  };

  return (
    <div className="category-picker">
      <div className="category-chips">
        {options.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <button
              type="button"
              key={cat.id}
              className={`chip-btn ${isSelected ? 'active' : ''}`}
              onClick={() => toggle(cat.id)}
              aria-pressed={isSelected}
            >
              <span aria-hidden="true">{cat.emoji}</span>
              <span>{cat.name}</span>
              {isSelected && <Check size={12} strokeWidth={3} aria-hidden="true" />}
            </button>
          );
        })}

        {onAddCustomCategory && !isCreating && (
          <button
            type="button"
            className="chip-btn chip-btn-add"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={13} aria-hidden="true" />
            <span>Nueva</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="cat-creator">
          <div className="cat-creator-row">
            <input
              type="text"
              className="form-input cat-creator-emoji"
              placeholder="🎡"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              aria-label="Emoji de la categoría"
            />
            <input
              ref={nameInputRef}
              type="text"
              className="form-input cat-creator-name"
              placeholder="Nombre (ej: Feria de diseño)"
              value={name}
              maxLength={28}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                // Enter acá no puede mandar el formulario de la cita entera.
                if (e.key === 'Enter') handleCreate(e);
              }}
              aria-label="Nombre de la categoría"
            />
            <button
              type="button"
              className="cat-creator-cancel"
              onClick={resetForm}
              aria-label="Cancelar"
            >
              <X size={15} />
            </button>
          </div>

          <div className="cat-creator-suggestions">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                type="button"
                key={e}
                className={`cat-emoji-option ${emoji === e ? 'active' : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="cat-creator-save"
            onClick={handleCreate}
            disabled={!name.trim() || !emoji.trim()}
          >
            Crear categoría
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
