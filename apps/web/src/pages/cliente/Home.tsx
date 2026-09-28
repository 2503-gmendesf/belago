import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useFavorites } from '../../features/discovery/FavoritesContext.js';
import { useProfessionals } from '../../features/discovery/useProfessionals.js';
import { useSearchFilters } from '../../features/discovery/SearchFiltersContext.js';
import { ProfessionalCard } from '../../features/discovery/components/ProfessionalCard.js';
import { CATEGORIES, distanceOf } from '../../features/discovery/utils.js';
import { Icon } from '../../components/Icon.js';

type HomeMode = 'near' | 'fav';

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { professionals, loading } = useProfessionals();
  const { favoriteIds } = useFavorites();
  const { startCategorySearch } = useSearchFilters();
  const [mode, setMode] = useState<HomeMode>('near');

  function goToCategory(id: Parameters<typeof startCategorySearch>[0]) {
    startCategorySearch(id);
    navigate('/cliente/explorar');
  }

  const list = useMemo(() => {
    let l = professionals.filter((p) => p.status === 'ativa');
    if (mode === 'fav') l = l.filter((p) => favoriteIds.has(p.id));
    return [...l].sort((a, b) => distanceOf(a) - distanceOf(b));
  }, [professionals, mode, favoriteIds]);

  const firstName = (user?.name ?? '').split(' ')[0];

  return (
    <div>
      <div className="rowf between gap8">
        <div>
          <p className="small muted">Olá, {firstName}</p>
          <h1 className="h1" style={{ marginTop: 2 }}>
            O que você
            <br />
            precisa hoje?
          </h1>
        </div>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Serviços</h2>
        </div>
        <div className="hscroll" style={{ marginTop: 12 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="cat" onClick={() => goToCategory(c.id)}>
              <div className="cat-img">
                <Icon name={c.icon} />
              </div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Profissionais</h2>
        </div>
        <div className="seg" style={{ marginTop: 12 }}>
          <button className={mode === 'near' ? 'active' : ''} onClick={() => setMode('near')}>
            Mais próximos
          </button>
          <button className={mode === 'fav' ? 'active' : ''} onClick={() => setMode('fav')}>
            Favoritados
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          {loading ? (
            <p className="small muted">Carregando…</p>
          ) : list.length ? (
            list.map((p) => <ProfessionalCard key={p.id} professional={p} />)
          ) : (
            <div className="empty">
              <Icon name="heart" />
              <p>Você ainda não favoritou nenhuma profissional.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
