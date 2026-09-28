import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Specialty } from '@belago/shared';
import { DEFAULT_FILTERS } from './types.js';
import type { SearchFilters } from './types.js';

interface SearchFiltersContextValue {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  setQuery: (query: string) => void;
  setQuick: (quick: SearchFilters['quick']) => void;
  filterCount: number;
  startCategorySearch: (category: Specialty) => void;
}

const SearchFiltersContext = createContext<SearchFiltersContextValue | null>(null);

export function SearchFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  function setQuery(query: string) {
    setFilters((f) => ({ ...f, query }));
  }

  function setQuick(quick: SearchFilters['quick']) {
    setFilters((f) => ({ ...f, quick }));
  }

  function startCategorySearch(category: Specialty) {
    setFilters({ ...DEFAULT_FILTERS, categories: [category] });
  }

  const filterCount = useMemo(
    () =>
      (filters.categories.length ? 1 : 0) +
      (filters.minRating ? 1 : 0) +
      (filters.minPrice !== '' || filters.maxPrice !== '' ? 1 : 0) +
      (filters.maxDistanceKm ? 1 : 0),
    [filters],
  );

  return (
    <SearchFiltersContext.Provider
      value={{ filters, setFilters, setQuery, setQuick, filterCount, startCategorySearch }}
    >
      {children}
    </SearchFiltersContext.Provider>
  );
}

export function useSearchFilters(): SearchFiltersContextValue {
  const ctx = useContext(SearchFiltersContext);
  if (!ctx) throw new Error('useSearchFilters deve ser usado dentro de SearchFiltersProvider');
  return ctx;
}
