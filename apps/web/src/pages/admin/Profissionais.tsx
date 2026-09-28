import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { AdminStatusTag } from '../../features/admin/components/AdminStatusTag.js';
import { ProfessionalDetailOverlay } from '../../features/admin/components/ProfessionalDetailOverlay.js';
import type { AdminProfAction, AdminProfessional, AdminProfStatus } from '../../features/admin/types.js';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const FILTERS: Array<[AdminProfStatus | 'todas', string]> = [
  ['todas', 'Todas'],
  ['pendente', 'Pendentes'],
  ['ativa', 'Ativas'],
  ['suspensa', 'Suspensas'],
];

const ACTION_MESSAGES: Record<AdminProfAction, string> = {
  aprovar: 'aprovada',
  advertir: 'advertida',
  suspender: 'suspensa',
  reativar: 'reativada',
  excluir: 'removida da plataforma',
  solicitar: 'notificada: documentos solicitados',
};

export function Profissionais() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filter = (searchParams.get('filtro') as AdminProfStatus | 'todas') ?? 'todas';

  const reload = useCallback(() => {
    dataSource.listAdminProfessionals().then(setProfessionals);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const counts = useMemo(
    () => ({
      total: professionals.length,
      ativa: professionals.filter((p) => p.status === 'ativa').length,
      pendente: professionals.filter((p) => p.status === 'pendente').length,
      suspensa: professionals.filter((p) => p.status === 'suspensa').length,
    }),
    [professionals],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professionals.filter((p) => {
      if (p.status === 'excluida') return false;
      if (filter !== 'todas' && p.status !== filter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.spec.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [professionals, filter, query]);

  const selectedPro = professionals.find((p) => p.id === selected) ?? null;

  async function handleAction(id: string, action: AdminProfAction) {
    setSubmitting(true);
    try {
      const pro = professionals.find((p) => p.id === id);
      await dataSource.adminProfessionalAction(id, action);
      setSelected(null);
      toast(`${pro?.name ?? 'Profissional'} ${ACTION_MESSAGES[action]}`);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="h1">Profissionais</h1>
      <div className="kpis-4" style={{ marginTop: 14 }}>
        {[
          ['Total', counts.total],
          ['Ativas', counts.ativa],
          ['Pendentes', counts.pendente],
          ['Suspensas', counts.suspensa],
        ].map(([label, value]) => (
          <div className="kpi-mini" key={label}>
            <p className="h2 num">{value}</p>
            <p className="tiny muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="search-box" style={{ margin: '14px 0 10px' }}>
        <Icon name="search" />
        <input
          placeholder="Buscar por nome ou especialidade"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chips">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={`chip${filter === k ? ' chip-active' : ''}`}
            onClick={() => setSearchParams(k === 'todas' ? {} : { filtro: k })}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {list.length ? (
          <div className="list">
            {list.map((p) => (
              <button className="li" key={p.id} onClick={() => setSelected(p.id)}>
                <div className="avatar">{initials(p.name)}</div>
                <div className="pro-body">
                  <p className="h3 ell">{p.name}</p>
                  <p className="small muted ell">
                    {p.spec} · {p.city}
                    {p.appointmentsCount ? ` · ${p.appointmentsCount} agend.` : ''}
                  </p>
                </div>
                <AdminStatusTag status={p.status} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="search" />
            <p>Nenhuma profissional encontrada.</p>
          </div>
        )}
      </div>

      <ProfessionalDetailOverlay
        professional={selectedPro}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        submitting={submitting}
      />
    </div>
  );
}
