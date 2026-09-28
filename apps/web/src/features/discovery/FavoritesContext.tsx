import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataSource } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    dataSource.listFavoriteIds(user.id).then((ids) => setFavoriteIds(new Set(ids)));
  }, [user]);

  const toggleFavorite = useCallback(
    async (professionalId: string) => {
      if (!user) return;
      const ids = await dataSource.toggleFavorite(user.id, professionalId);
      setFavoriteIds(new Set(ids));
    },
    [user],
  );

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider');
  return ctx;
}
