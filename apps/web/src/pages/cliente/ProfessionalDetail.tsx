import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { dataSource } from '../../services/index.js';
import { useFavorites } from '../../features/discovery/FavoritesContext.js';
import { activeServices, categoryName, formatDistance } from '../../features/discovery/utils.js';
import { socialUrl } from '../../features/discovery/socials.js';
import { useBooking } from '../../features/booking/BookingContext.js';
import { brl } from '../../lib/format.js';
import type { Professional } from '../../features/discovery/types.js';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatDayLabel(iso: string): { dow: string; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return { dow: DOW[date.getDay()] ?? '', day: date.getDate() };
}

export function ProfessionalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const booking = useBooking();
  const [professional, setProfessional] = useState<Professional | null | undefined>(undefined);
  const [days, setDays] = useState<Array<[string, number]>>([]);

  useEffect(() => {
    if (!id) return;
    dataSource.getProfessional(id).then(setProfessional);
    dataSource.getAvailableDays(id).then(setDays);
  }, [id]);

  if (professional === undefined) {
    return <p className="small muted">Carregando…</p>;
  }
  if (professional === null) {
    return (
      <div>
        <button className="back" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" />
          Voltar
        </button>
        <p className="small muted" style={{ marginTop: 16 }}>
          Profissional não encontrada.
        </p>
      </div>
    );
  }

  const p = professional;
  const socials = Object.entries(p.socials).filter(([, v]) => v) as [keyof Professional['socials'], string][];
  const dist = formatDistance(p);

  function goToBooking(serviceId: string | null, date: string | null = null) {
    booking.start(p.id, serviceId, date);
    navigate('/cliente/agendar');
  }

  return (
    <div>
      <button className="back" onClick={() => navigate(-1)}>
        <Icon name="chevron-left" />
        Voltar
      </button>

      <div className="rowf gap16" style={{ marginTop: 8 }}>
        <div className="avatar avatar-lg">{p.photoUrl ? '' : initials(p.name)}</div>
        <div className="pro-body">
          <h1 className="h1">{p.name}</h1>
          <div className="pro-meta" style={{ flexWrap: 'wrap' }}>
            <span className="pro-rating">
              <Icon name="star" /> {p.rating.toFixed(1)}{' '}
              <span className="muted" style={{ fontWeight: 500 }}>
                ({p.reviewsCount})
              </span>
            </span>
            {dist && <span className="small muted">{dist}</span>}
          </div>
          <p className="small muted" style={{ marginTop: 2 }}>
            {p.city}
          </p>
        </div>
        <button
          type="button"
          className={`fav${isFavorite(p.id) ? ' fav-on' : ''}`}
          aria-label="Favoritar"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => void toggleFavorite(p.id)}
        >
          <Icon name="heart" />
        </button>
      </div>

      {socials.length > 0 && (
        <div className="rowf gap8" style={{ marginTop: 16 }}>
          {socials.map(([key, value]) => (
            <a
              key={key}
              className="icon-btn"
              href={socialUrl(key, value)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key}
            >
              <Icon name={key} />
            </a>
          ))}
        </div>
      )}

      {p.bio && (
        <p className="muted" style={{ marginTop: 16 }}>
          {p.bio}
        </p>
      )}

      {p.photos.length > 0 && (
        <div className="section">
          <h2 className="h2" style={{ marginBottom: 12 }}>
            Trabalhos
          </h2>
          <div className="photo-grid">
            {p.photos.slice(0, 6).map((url) => (
              <div key={url} className="ph" style={{ backgroundImage: `url('${url}')` }} />
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Serviços
        </h2>
        <div className="list">
          {activeServices(p).length ? (
            activeServices(p).map((s) => (
              <div className="li" key={s.id}>
                <div className="pro-body">
                  <p className="h3">{s.name}</p>
                  <p className="small muted">
                    {categoryName(s.category)} · {s.durationMin} min
                  </p>
                </div>
                <p className="h3 num">{brl(s.price)}</p>
                <button className="btn btn-sm btn-sec" onClick={() => goToBooking(s.id)}>
                  Agendar
                </button>
              </div>
            ))
          ) : (
            <div className="empty">Sem serviços ativos.</div>
          )}
        </div>
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Próximos horários
        </h2>
        {days.length ? (
          <div className="daystrip">
            {days.map(([date, count]) => {
              const { dow, day } = formatDayLabel(date);
              return (
                <button key={date} className="day" onClick={() => goToBooking(null, date)}>
                  <small>{dow}</small>
                  <b>{day}</b>
                  <small style={{ textTransform: 'none' }}>{pluralHor(count)}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="small muted">Sem horários abertos nos próximos dias.</p>
        )}
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Avaliações
        </h2>
        {p.reviews.length ? (
          p.reviews.slice(0, 5).map((r, i) => (
            <div className="card" key={i} style={{ marginBottom: 8 }}>
              <div className="rowf between">
                <p className="h3">{r.name}</p>
                <span className="pro-rating">
                  <Icon name="star" /> {r.rating}
                </span>
              </div>
              {r.text && (
                <p className="small muted" style={{ marginTop: 6 }}>
                  {r.text}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="small muted">Ainda sem avaliações.</p>
        )}
      </div>
    </div>
  );
}

function pluralHor(n: number): string {
  return `${n} hor.`;
}
