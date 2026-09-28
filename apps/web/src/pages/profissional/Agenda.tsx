import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import { ProAppointmentCard } from '../../features/proAgenda/components/ProAppointmentCard.js';
import { AvailabilityPanel } from '../../features/proAgenda/components/AvailabilityPanel.js';
import { appointmentStart, phaseOf } from '../../features/appointments/utils.js';
import type { ProAppointmentView } from '../../features/appointments/types.js';

type Tab = 'prox' | 'hist' | 'disp';

export function Agenda() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('prox');
  const [appointments, setAppointments] = useState<ProAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const reload = useCallback(() => {
    if (!user) return;
    dataSource
      .getMyProfessional(user.id)
      .then((pro) => dataSource.listProAppointments(pro.id))
      .then((list) => {
        setAppointments(list);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = appointments.filter((a) => (tab === 'prox' ? phaseOf(a) === 'confirmado' : phaseOf(a) !== 'confirmado'));
    if (q) {
      filtered = filtered.filter(
        (a) => a.clientName.toLowerCase().includes(q) || a.serviceName.toLowerCase().includes(q),
      );
    }
    return [...filtered].sort((a, b) =>
      tab === 'prox'
        ? appointmentStart(a).getTime() - appointmentStart(b).getTime()
        : appointmentStart(b).getTime() - appointmentStart(a).getTime(),
    );
  }, [appointments, tab, query]);

  return (
    <div>
      <h1 className="h1">Agenda</h1>
      <div className="seg" style={{ marginTop: 14 }}>
        <button className={tab === 'prox' ? 'active' : ''} onClick={() => setTab('prox')}>
          Próximos
        </button>
        <button className={tab === 'hist' ? 'active' : ''} onClick={() => setTab('hist')}>
          Histórico
        </button>
        <button className={tab === 'disp' ? 'active' : ''} onClick={() => setTab('disp')}>
          Disponibilidade
        </button>
      </div>

      {tab === 'disp' ? (
        <div style={{ marginTop: 16 }}>
          <AvailabilityPanel />
        </div>
      ) : (
        <>
          <div className="search-box" style={{ margin: '12px 0 14px' }}>
            <Icon name="search" />
            <input
              placeholder="Buscar por cliente ou serviço"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="small muted">Carregando…</p>
          ) : list.length ? (
            list.map((a) => <ProAppointmentCard key={a.id} appointment={a} showReview={tab === 'hist'} />)
          ) : (
            <div className="empty">
              <Icon name="calendar" />
              <p>{query ? 'Nada encontrado para essa busca.' : tab === 'prox' ? 'Nenhum agendamento futuro.' : 'Seu histórico aparece aqui.'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
