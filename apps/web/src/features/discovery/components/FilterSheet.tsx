import { useEffect, useState } from 'react';
import type { Specialty } from '@belago/shared';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { CATEGORIES } from '../utils.js';
import { DEFAULT_FILTERS } from '../types.js';
import type { SearchFilters } from '../types.js';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

const RATING_OPTIONS: Array<[number, string]> = [
  [0, 'Qualquer'],
  [3, '3+'],
  [4, '4+'],
  [4.5, '4,5+'],
];

const DISTANCE_OPTIONS: Array<[number, string]> = [
  [0, 'Qualquer'],
  [1, '1 km'],
  [3, '3 km'],
  [5, '5 km'],
  [10, '10 km'],
];

export function FilterSheet({ open, onClose, filters, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<SearchFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  function toggleCategory(id: Specialty) {
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(id) ? d.categories.filter((c) => c !== id) : [...d.categories, id],
    }));
  }

  function handleApply() {
    const min = draft.minPrice === '' ? null : Number(draft.minPrice);
    const max = draft.maxPrice === '' ? null : Number(draft.maxPrice);
    if ((min !== null && min < 0) || (max !== null && max < 0) || (min !== null && max !== null && min > max)) {
      return;
    }
    onApply(draft);
    onClose();
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Filtros</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>

      <p className="eyebrow" style={{ marginBottom: 8 }}>
        Serviço
      </p>
      <div className="chips chips-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip${draft.categories.includes(c.id) ? ' chip-active' : ''}`}
            onClick={() => toggleCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Avaliação mínima
      </p>
      <div className="chips chips-wrap">
        {RATING_OPTIONS.map(([v, l]) => (
          <button
            key={v}
            className={`chip${draft.minRating === v ? ' chip-active' : ''}`}
            onClick={() => setDraft((d) => ({ ...d, minRating: v }))}
          >
            {l}
          </button>
        ))}
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Preço (R$)
      </p>
      <div className="rowf gap12">
        <input
          className="input"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Mínimo"
          value={draft.minPrice}
          onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
        />
        <input
          className="input"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Máximo"
          value={draft.maxPrice}
          onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
        />
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Distância máxima
      </p>
      <div className="chips chips-wrap">
        {DISTANCE_OPTIONS.map(([v, l]) => (
          <button
            key={v}
            className={`chip${draft.maxDistanceKm === v ? ' chip-active' : ''}`}
            onClick={() => setDraft((d) => ({ ...d, maxDistanceKm: v }))}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="rowf gap8" style={{ marginTop: 26, marginBottom: 8 }}>
        <Button variant="sec" onClick={() => setDraft(DEFAULT_FILTERS)}>
          Limpar
        </Button>
        <Button onClick={handleApply}>Aplicar</Button>
      </div>
    </Overlay>
  );
}
