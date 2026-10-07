import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CFG } from '@belago/shared';
import { Icon } from '../../components/Icon.js';
import { Button } from '../../components/Button.js';
import { Overlay } from '../../components/Overlay.js';
import { useToast } from '../../components/ToastProvider.js';
import { useAuth } from '../../context/AuthContext.js';
import { useRates } from '../../context/ratesContext.js';
import { dataSource } from '../../services/index.js';
import { useBooking } from '../../features/booking/BookingContext.js';
import { activeServices } from '../../features/discovery/utils.js';
import { brl, fmtDayLong, fmtDayShort, fromMinutes, pctLabel, toMinutes } from '../../lib/format.js';
import type { Professional } from '../../features/discovery/types.js';
import type { AppointmentView } from '../../features/appointments/types.js';

export function Booking() {
  const rates = useRates();
  const { booking, update, setStep } = useBooking();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [days, setDays] = useState<Array<[string, number]>>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<AppointmentView | null>(null);

  useEffect(() => {
    if (!booking) {
      navigate('/cliente', { replace: true });
      return;
    }
    dataSource.getProfessional(booking.professionalId).then(setProfessional);
  }, [booking, navigate]);

  useEffect(() => {
    if (!booking?.serviceId) {
      setDays([]);
      return;
    }
    dataSource.getAvailableDays(booking.professionalId, booking.serviceId).then(setDays);
  }, [booking?.professionalId, booking?.serviceId]);

  useEffect(() => {
    if (!booking?.serviceId || !booking.date) {
      setTimes([]);
      return;
    }
    dataSource.getAvailableTimes(booking.professionalId, booking.date, booking.serviceId).then(setTimes);
  }, [booking?.professionalId, booking?.serviceId, booking?.date]);

  if (!booking || !professional) {
    return <p className="small muted">Carregando…</p>;
  }

  const p = professional;
  const service = p.services.find((s) => s.id === booking.serviceId);
  const ready = Boolean(
    booking.serviceId && booking.date && booking.time && (booking.location !== 'domicilio' || booking.address.trim().length >= 8),
  );

  function goBack() {
    if (booking && booking.step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  }

  async function confirm() {
    if (!user || !booking || !service) return;
    setSubmitting(true);
    try {
      const appt = await dataSource.createAppointment(user.id, {
        professionalId: booking.professionalId,
        serviceId: booking.serviceId!,
        scheduledDate: booking.date!,
        scheduledTime: booking.time!,
        location: booking.location,
        address: booking.address.trim(),
      });
      setConfirmed(appt);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível concluir o agendamento.');
      update('time', null);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  function closeSuccessAndGo(path: string) {
    // não zera o booking aqui: a próxima chamada a start() já sobrescreve o rascunho,
    // e um reset síncrono corria com o useEffect de guarda e desviava a navegação.
    setConfirmed(null);
    navigate(path, { replace: true });
  }

  return (
    <div>
      <button className="back" onClick={goBack}>
        <Icon name="chevron-left" />
        Voltar
      </button>
      <p className="eyebrow" style={{ marginTop: 6 }}>
        Passo {booking.step} de 2
      </p>
      <h1 className="h1" style={{ margin: '4px 0 16px' }}>
        {booking.step === 1 ? 'Agendar' : 'Resumo'}
      </h1>

      {booking.step === 1 ? (
        <>
          <div className="rowf gap12">
            <div className="avatar">{p.name.slice(0, 1)}</div>
            <div>
              <p className="h3">{p.name}</p>
              <p className="small muted">
                <span className="pro-rating" style={{ display: 'inline-flex' }}>
                  <Icon name="star" /> {p.rating.toFixed(1)}
                </span>
              </p>
            </div>
          </div>

          <div className="section">
            <h2 className="h2" style={{ marginBottom: 10 }}>
              Serviço
            </h2>
            <div className="list">
              {activeServices(p).map((s) => (
                <button key={s.id} className="li" onClick={() => update('serviceId', s.id)}>
                  <div className="pro-body">
                    <p className="h3">{s.name}</p>
                    <p className="small muted">
                      {s.durationMin} min · {brl(s.price)}
                    </p>
                  </div>
                  {booking.serviceId === s.id && <Icon name="check-c" />}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <h2 className="h2" style={{ marginBottom: 10 }}>
              Data
            </h2>
            {!service ? (
              <p className="small muted">Selecione um serviço para ver as datas.</p>
            ) : days.length ? (
              <div className="daystrip">
                {days.map(([date, count]) => {
                  const { dow, day, mon } = fmtDayShort(date);
                  return (
                    <button
                      key={date}
                      className={`day${booking.date === date ? ' day-active' : ''}${count ? '' : ' day-off'}`}
                      onClick={() => update('date', date)}
                    >
                      <small>{dow}</small>
                      <b>{day}</b>
                      <small style={{ textTransform: 'none' }}>{mon}</small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty" style={{ padding: 20 }}>
                <Icon name="calendar" />
                <p>Sem horários disponíveis para este serviço nos próximos dias.</p>
              </div>
            )}
          </div>

          {booking.date && service && (
            <div className="section">
              <h2 className="h2" style={{ marginBottom: 10 }}>
                Horário
              </h2>
              <div className="slot-grid">
                {times.map((t) => (
                  <button
                    key={t}
                    className={`slot${booking.time === t ? ' slot-active' : ''}`}
                    onClick={() => update('time', t)}
                  >
                    {t}
                  </button>
                ))}
                {times.length === 0 && <p className="small muted">Sem horários livres nesse dia.</p>}
              </div>
            </div>
          )}

          {booking.time && p.attendsHome && (
            <div className="section">
              <h2 className="h2" style={{ marginBottom: 10 }}>
                Local
              </h2>
              <div className="seg">
                <button
                  className={booking.location === 'estudio' ? 'active' : ''}
                  onClick={() => update('location', 'estudio')}
                >
                  Com a profissional
                </button>
                <button
                  className={booking.location === 'domicilio' ? 'active' : ''}
                  onClick={() => update('location', 'domicilio')}
                >
                  Em domicílio
                </button>
              </div>
              {booking.location === 'domicilio' && (
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Seu endereço (taxa de {brl(rates.homeFee)})</label>
                  <input
                    className="input"
                    placeholder="Rua, número, bairro"
                    value={booking.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 26 }}>
            <Button disabled={!ready} onClick={() => setStep(2)}>
              Revisar agendamento
            </Button>
          </div>
        </>
      ) : (
        service && (
          <>
            <div className="card">
              <div className="rowf gap12" style={{ marginBottom: 8 }}>
                <div className="avatar">{p.name.slice(0, 1)}</div>
                <div>
                  <p className="h3">{p.name}</p>
                  <p className="small muted">{service.name}</p>
                </div>
              </div>
              <div className="kv">
                <span>Data</span>
                <span>{fmtDayLong(booking.date!)}</span>
              </div>
              <div className="kv">
                <span>Horário</span>
                <span>
                  {booking.time} – {fromMinutes(toMinutes(booking.time!) + service.durationMin)}
                </span>
              </div>
              <div className="kv">
                <span>Local</span>
                <span>{booking.location === 'domicilio' ? 'Em domicílio' : 'No local da profissional'}</span>
              </div>
              <div className="kv">
                <span>{booking.location === 'domicilio' ? 'Endereço' : 'Endereço do local'}</span>
                <span style={{ maxWidth: '60%' }}>
                  {booking.location === 'domicilio' ? booking.address : p.address}
                </span>
              </div>
              <div className="kv">
                <span>Serviço</span>
                <span className="num">{brl(service.price)}</span>
              </div>
              {booking.location === 'domicilio' && (
                <div className="kv">
                  <span>Taxa de deslocamento</span>
                  <span className="num">{brl(rates.homeFee)}</span>
                </div>
              )}
              <div className="kv">
                <span>Total</span>
                <span className="num" style={{ fontSize: 17 }}>
                  {brl(service.price + (booking.location === 'domicilio' ? rates.homeFee : 0))}
                </span>
              </div>
            </div>
            <p className="tiny muted" style={{ margin: '12px 4px 18px' }}>
              Cancelamento sem custo até {CFG.lateCancelHours}h antes do horário. Depois disso, pode haver cobrança de{' '}
              {pctLabel(rates.lateCancelPenaltyRate)}%.
            </p>
            <Button disabled={submitting} onClick={confirm}>
              Confirmar agendamento
            </Button>
            <Button variant="ghost" style={{ marginTop: 6 }} onClick={() => setStep(1)}>
              Editar
            </Button>
          </>
        )
      )}

      <Overlay open={confirmed !== null} onClose={() => {}}>
        {confirmed && (
          <div>
            <div className="center" style={{ textAlign: 'center' }}>
              <div className="confirm-ic">
                <Icon name="check-c" />
              </div>
              <h2 className="h2">Agendamento confirmado</h2>
              <p className="muted small" style={{ margin: '8px 0 18px' }}>
                Ele já aparece na sua Agenda.
              </p>
            </div>
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="kv">
                <span>Profissional</span>
                <span>{confirmed.professionalName}</span>
              </div>
              <div className="kv">
                <span>Serviço</span>
                <span>{confirmed.serviceName}</span>
              </div>
              <div className="kv">
                <span>Quando</span>
                <span>
                  {fmtDayLong(confirmed.scheduledDate)}, {confirmed.scheduledTime}
                </span>
              </div>
            </div>
            <div className="stack gap8">
              <Button onClick={() => closeSuccessAndGo('/cliente/agenda')}>Ver na agenda</Button>
              <Button variant="sec" onClick={() => closeSuccessAndGo('/cliente')}>
                Voltar ao início
              </Button>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
}
