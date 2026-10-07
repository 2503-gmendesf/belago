import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { Button } from '../../components/Button.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import type { AdminClient } from '../../features/admin/types.js';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Clientes() {
  const { toast } = useToast();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [query, setQuery] = useState('');

  const reload = useCallback(() => {
    dataSource
      .listAdminClients()
      .then(setClients)
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Não foi possível carregar as clientes'));
  }, [toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const counts = useMemo(
    () => ({
      total: clients.length,
      ativa: clients.filter((c) => c.status === 'ativa').length,
      bloqueada: clients.filter((c) => c.status === 'bloqueada').length,
    }),
    [clients],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, query]);

  async function handleToggle(client: AdminClient) {
    try {
      await dataSource.toggleAdminClientBlock(client.id);
      toast(`${client.name} ${client.status === 'bloqueada' ? 'desbloqueado' : 'bloqueado'}`);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível alterar o bloqueio');
    }
  }

  return (
    <div>
      <h1 className="h1">Clientes</h1>
      <div className="kpis-3" style={{ marginTop: 14 }}>
        {[
          ['Total', counts.total],
          ['Ativos', counts.ativa],
          ['Bloqueados', counts.bloqueada],
        ].map(([label, value]) => (
          <div className="kpi-mini" key={label}>
            <p className="h2 num">{value}</p>
            <p className="tiny muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="search-box" style={{ margin: '14px 0' }}>
        <Icon name="search" />
        <input placeholder="Buscar por nome ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {list.length ? (
        <div className="list">
          {list.map((c) => {
            const blocked = c.status === 'bloqueada';
            return (
              <div className="li" key={c.id}>
                <div className="avatar" style={blocked ? { opacity: 0.5 } : undefined}>
                  {initials(c.name)}
                </div>
                <div className="pro-body">
                  <p className="h3 ell" style={blocked ? { opacity: 0.5 } : undefined}>
                    {c.name}
                  </p>
                  <p className="small muted ell">
                    {c.email} · {c.appointmentsCount} agend.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={blocked ? 'sec' : 'danger'}
                  style={{ width: 'auto' }}
                  onClick={() => handleToggle(c)}
                >
                  {blocked ? 'Desbloquear' : 'Bloquear'}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <Icon name="search" />
          <p>Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  );
}
