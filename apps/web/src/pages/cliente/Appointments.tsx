import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useToast } from '../../components/ToastProvider.js';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import { AppointmentCard } from '../../features/appointments/components/AppointmentCard.js';
import { DetailOverlay } from '../../features/appointments/components/DetailOverlay.js';
import { CancelOverlay } from '../../features/appointments/components/CancelOverlay.js';
import { RatingOverlay } from '../../features/appointments/components/RatingOverlay.js';
import { appointmentStart, phaseOf } from '../../features/appointments/utils.js';
import type { AppointmentView } from '../../features/appointments/types.js';

type Tab = 'prox' | 'hist';

export function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('prox');
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    dataSource.listAppointments(user.id).then((list) => {
      setAppointments(list);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = useMemo(() => {
    const filtered = appointments.filter((a) => (tab === 'prox' ? phaseOf(a) === 'confirmado' : phaseOf(a) !== 'confirmado'));
    return filtered.sort((a, b) =>
      tab === 'prox'
        ? appointmentStart(a).getTime() - appointmentStart(b).getTime()
        : appointmentStart(b).getTime() - appointmentStart(a).getTime(),
    );
  }, [appointments, tab]);

  const detail = appointments.find((a) => a.id === detailId) ?? null;
  const toCancel = appointments.find((a) => a.id === cancelId) ?? null;
  const toRate = appointments.find((a) => a.id === rateId) ?? null;

  async function handleCancel() {
    if (!user || !cancelId) return;
    setSubmitting(true);
    try {
      await dataSource.cancelAppointment(user.id, cancelId);
      toast('Agendamento cancelado');
      setCancelId(null);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRate(rating: number, text: string) {
    if (!user || !rateId) return;
    setSubmitting(true);
    try {
      await dataSource.rateAppointment(user.id, rateId, rating, text);
      toast('Avaliação enviada');
      setRateId(null);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

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
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <p className="small muted">Carregando…</p>
        ) : list.length ? (
          list.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onCancel={() => setCancelId(a.id)}
              onRate={() => setRateId(a.id)}
              onDetails={() => setDetailId(a.id)}
            />
          ))
        ) : (
          <div className="empty">
            <Icon name="calendar" />
            <p>{tab === 'prox' ? 'Você não tem agendamentos futuros.' : 'Seu histórico aparece aqui.'}</p>
            {tab === 'prox' && (
              <button className="btn btn-sm" style={{ margin: '14px auto 0' }} onClick={() => navigate('/cliente/explorar')}>
                Explorar profissionais
              </button>
            )}
          </div>
        )}
      </div>

      <DetailOverlay
        appointment={detail}
        onClose={() => setDetailId(null)}
        onCancel={() => setCancelId(detail?.id ?? null)}
        onRate={() => setRateId(detail?.id ?? null)}
      />
      <CancelOverlay
        appointment={toCancel}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        submitting={submitting}
      />
      <RatingOverlay
        appointment={toRate}
        onClose={() => setRateId(null)}
        onSubmit={handleRate}
        submitting={submitting}
      />
    </div>
  );
}
