import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.js';
import { useFavorites } from '../FavoritesContext.js';
import { activeServices, formatDistance } from '../utils.js';
import type { Professional } from '../types.js';

interface ProfessionalCardProps {
  professional: Professional;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfessionalCard({ professional: p }: ProfessionalCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const svcNames = activeServices(p).slice(0, 3).map((s) => s.name).join(' · ');
  const dist = formatDistance(p);

  return (
    <div
      className="pro"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/cliente/profissional/${p.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/cliente/profissional/${p.id}`);
      }}
    >
      <div className="avatar avatar-md">{p.photoUrl ? '' : initials(p.name)}</div>
      <div className="pro-body">
        <div className="pro-head">
          <p className="h3 ell">{p.name}</p>
          <button
            type="button"
            className={`fav${isFavorite(p.id) ? ' fav-on' : ''}`}
            aria-label="Favoritar"
            onClick={(e) => {
              e.stopPropagation();
              void toggleFavorite(p.id);
            }}
          >
            <Icon name="heart" />
          </button>
        </div>
        <div className="pro-meta">
          <span className="pro-rating">
            <Icon name="star" /> {p.rating.toFixed(1)}
          </span>
          {dist && (
            <>
              <span className="pro-sep" />
              <span className="small muted">{dist}</span>
            </>
          )}
        </div>
        <p className="small muted ell">{svcNames || 'Sem serviços ativos'}</p>
      </div>
    </div>
  );
}
