import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { useFavorites } from '../../features/discovery/FavoritesContext.js';
import { useProfessionals } from '../../features/discovery/useProfessionals.js';
import { useSearchFilters } from '../../features/discovery/SearchFiltersContext.js';
import { ProfessionalCard } from '../../features/discovery/components/ProfessionalCard.js';
import { FilterSheet } from '../../features/discovery/components/FilterSheet.js';
import { categoryName, pluralize, searchProfessionals } from '../../features/discovery/utils.js';
import type { SearchFilters as Filters } from '../../features/discovery/types.js';

const QUICK_OPTIONS: Array<[Filters['quick'], string]> = [
  ['near', 'Mais próximos'],
  ['best', 'Melhor avaliados'],
  ['today', 'Disponível hoje'],
  ['fav', 'Favoritos'],
];

export function Search() {
  const { professionals } = useProfessionals();
  const { favoriteIds } = useFavorites();
  const { filters, setFilters, setQuery, setQuick, filterCount } = useSearchFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(
    () => searchProfessionals(professionals, filters, favoriteIds),
    [professionals, filters, favoriteIds],
  );

  function dropCategory(id: Filters['categories'][number]) {
    setFilters({ ...filters, categories: filters.categories.filter((c) => c !== id) });
  }

  return (
    <div>
      <h1 className="h1">Explorar</h1>

      <div className="rowf gap8" style={{ marginTop: 14 }}>
        <div className="search-box">
          <Icon name="search" />
          <input
            placeholder="Profissional ou serviço"
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="icon-btn"
          style={{ width: 48, height: 48, borderRadius: 'var(--r-md)' }}
          onClick={() => setFiltersOpen(true)}
          aria-label="Filtros"
        >
          <Icon name="sliders" />
          {filterCount > 0 && <span className="dot" style={{ top: 11, right: 11 }} />}
        </button>
      </div>

      <div className="chips" style={{ marginTop: 12 }}>
        {QUICK_OPTIONS.map(([k, l]) => (
          <button key={k} className={`chip${filters.quick === k ? ' chip-active' : ''}`} onClick={() => setQuick(k)}>
            {l}
          </button>
        ))}
      </div>

      {filters.categories.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {filters.categories.map((id) => (
            <button key={id} className="chip chip-active" onClick={() => dropCategory(id)}>
              {categoryName(id)}
              <Icon name="x" />
            </button>
          ))}
        </div>
      )}

      <p className="small muted" style={{ margin: '16px 0 10px' }}>
        {pluralize(results.length, 'profissional encontrada', 'profissionais encontradas')}
      </p>

      <div>
        {results.length ? (
          results.map((p) => <ProfessionalCard key={p.id} professional={p} />)
        ) : (
          <div className="empty">
            <Icon name="search" />
            <p>
              Nenhuma profissional encontrada.
              <br />
              Tente ajustar a busca ou os filtros.
            </p>
          </div>
        )}
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
