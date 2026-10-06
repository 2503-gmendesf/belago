import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CFG } from '@belago/shared';
import { Icon } from '../../components/Icon.js';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import { brl, isoFromDate, addDays } from '../../lib/format.js';
import { appointmentStart, phaseOf, totalOf } from '../../features/appointments/utils.js';
import { ProAppointmentCard } from '../../features/proAgenda/components/ProAppointmentCard.js';
import { NotificationsOverlay } from '../../features/notifications/NotificationsOverlay.js';
import { useNotifications } from '../../features/notifications/useNotifications.js';
import type { ProAppointmentView } from '../../features/appointments/types.js';

const DAY_MS = 86400000;

function netOf(a: ProAppointmentView): number {
  return totalOf(a) * (1 - CFG.commissionRate);
}

function sumNet(list: ProAppointmentView[]): number {
  return list.reduce((s, a) => s + netOf(a), 0);
}

export function Inicio() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ProAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, hasUnread, markAllRead } = useNotifications();

  useEffect(() => {
    if (!user) return;
    dataSource
      .getMyProfessional(user.id)
      .then((pro) => dataSource.listProAppointments(pro.id))
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [user]);

  const { done, next, upcoming } = useMemo(() => {
    const now = new Date();
    const from = new Date(`${addDays(isoFromDate(now), -29)}T00:00:00`);
    const limit = new Date(now.getTime() + 30 * DAY_MS);
    const confirmed = appointments.filter((a) => phaseOf(a) === 'confirmado');
    return {
      done: appointments.filter((a) => phaseOf(a) === 'realizado' && appointmentStart(a) >= from),
      next: confirmed.filter((a) => appointmentStart(a) <= limit),
      upcoming: [...confirmed]
        .sort((a, b) => appointmentStart(a).getTime() - appointmentStart(b).getTime())
        .slice(0, 5),
    };
  }, [appointments]);

  const firstName = (user?.name ?? '').split(' ')[0];

  return (
    <div>
      <div className="rowf between gap8">
        <div>
          <p className="small muted">Olá, {firstName}</p>
          <h1 className="h1" style={{ marginTop: 2 }}>
            Seu painel
          </h1>
        </div>
        <button className="icon-btn" onClick={() => setNotifOpen(true)} aria-label="Notificações">
          <Icon name="bell" />
          {hasUnread && <span className="dot" />}
        </button>
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Últimos 30 dias
        </p>
        <div className="kpis">
          <div className="kpi">
            <p className="small muted">Serviços realizados</p>
            <p className="v num">{done.length}</p>
          </div>
          <div className="kpi kpi-dark">
            <p className="eyebrow">Valor recebido</p>
            <p className="v num">{brl(sumNet(done))}</p>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Próximos 30 dias
        </p>
        <div className="kpis">
          <div className="kpi">
            <p className="small muted">Serviços agendados</p>
            <p className="v num">{next.length}</p>
          </div>
          <div className="kpi">
            <p className="small muted">Valor a receber</p>
            <p className="v num">{brl(sumNet(next))}</p>
          </div>
        </div>
        <p className="tiny faint" style={{ marginTop: 10 }}>
          Valores líquidos, já descontada a comissão de {Math.round(CFG.commissionRate * 100)}%.
        </p>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Próximos agendamentos</h2>
          <Link to="/profissional/agenda" className="small" style={{ fontWeight: 600, textDecoration: 'none' }}>
            Ver todos
          </Link>
        </div>
        {loading ? (
          <p className="small muted">Carregando…</p>
        ) : upcoming.length ? (
          upcoming.map((a) => <ProAppointmentCard key={a.id} appointment={a} />)
        ) : (
          <div className="empty">
            <Icon name="calendar" />
            <p>Nenhum agendamento futuro.</p>
          </div>
        )}
      </div>

      <NotificationsOverlay
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          void markAllRead().then(() => setNotifOpen(false));
        }}
      />
    </div>
  );
}
