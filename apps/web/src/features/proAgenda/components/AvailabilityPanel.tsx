import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon.js';
import { Button } from '../../../components/Button.js';
import { useToast } from '../../../components/ToastProvider.js';
import { useAuth } from '../../../context/AuthContext.js';
import { dataSource } from '../../../services/index.js';
import { activeServices } from '../../discovery/utils.js';
import { fmtDayLong, isoFromDate, todayISO } from '../../../lib/format.js';
import { SlotFormOverlay } from './SlotFormOverlay.js';
import type { Professional, ProAvailabilitySlot } from '../../discovery/types.js';

const DOW_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface SlotFormState {
  date: string;
  editTime: string | null;
}

export function AvailabilityPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pro, setPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [form, setForm] = useState<SlotFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    dataSource.getMyProfessional(user.id).then(setPro);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const today = todayISO();
  const isPast = selectedDate < today;

  function selectDate(date: string) {
    setSelectedDate(date);
    const d = new Date(date);
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function shiftMonth(dir: number) {
    setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
  }

  const monthDays = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const startDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return { y, m, startDow, daysInMonth };
  }, [monthCursor]);

  const monthTitle = (() => {
    const raw = monthCursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const slots = useMemo(
    () => [...(pro?.availability[selectedDate] ?? [])].sort((a, b) => a.time.localeCompare(b.time)),
    [pro, selectedDate],
  );

  async function handleSave(times: string[], all: boolean, serviceIds: string[]) {
    if (!pro || !form) return;
    setSubmitting(true);
    try {
      const current = pro.availability[form.date] ?? [];
      const merged: ProAvailabilitySlot[] = [...current];
      times.forEach((time) => {
        const entry: ProAvailabilitySlot = { time, all, serviceIds };
        const i = merged.findIndex((s) => s.time === time);
        if (i >= 0) merged[i] = entry;
        else merged.push(entry);
      });
      merged.sort((a, b) => a.time.localeCompare(b.time));
      await dataSource.setAvailabilitySlots(pro.id, form.date, merged);
      setForm(null);
      toast('Disponibilidade salva');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(time: string) {
    if (!pro) return;
    await dataSource.removeAvailabilitySlot(pro.id, selectedDate, time);
    toast('Horário removido');
    reload();
  }

  if (!pro) return <p className="small muted">Carregando…</p>;

  const active = activeServices(pro);

  return (
    <div>
      <div className="rowf between" style={{ margin: '4px 0 8px' }}>
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
          <Icon name="chevron-left" />
        </button>
        <p className="h3">{monthTitle}</p>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
          <Icon name="chevron-right" />
        </button>
      </div>

      <div className="cal-grid">
        {DOW_LABELS.map((d, i) => (
          <div key={i} className="cal-dow">
            {d}
          </div>
        ))}
        {Array.from({ length: monthDays.startDow }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: monthDays.daysInMonth }, (_, i) => {
          const date = isoFromDate(new Date(monthDays.y, monthDays.m, i + 1));
          const classes = [
            'cal-day',
            (pro.availability[date] ?? []).length ? 'cal-day-has' : '',
            date === selectedDate ? 'cal-day-sel' : '',
            date === today ? 'cal-day-today' : '',
            date < today ? 'cal-day-mute' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={date} className={classes} onClick={() => selectDate(date)}>
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Ir para uma data</label>
        <input
          className="input"
          type="date"
          value={selectedDate}
          onChange={(e) => selectDate(e.target.value)}
        />
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">{fmtDayLong(selectedDate)}</h2>
        </div>
        {slots.length ? (
          <div className="list" style={{ marginTop: 10 }}>
            {slots.map((slot) => (
              <div className="slot-row" key={slot.time}>
                <div className="slot-time">
                  <p className="h3 num">{slot.time}</p>
                </div>
                <div className="pro-body">
                  <p className="small muted">
                    {slot.all
                      ? 'Todos os serviços ativos'
                      : slot.serviceIds.map((id) => pro.services.find((s) => s.id === id)?.name ?? '—').join(', ')}
                  </p>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setForm({ date: selectedDate, editTime: slot.time })}
                  aria-label="Editar"
                >
                  <Icon name="pencil" />
                </button>
                <button className="icon-btn" onClick={() => handleRemove(slot.time)} aria-label="Remover">
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ padding: 24 }}>
            <Icon name="clock" />
            <p>Nenhum horário nesta data.</p>
          </div>
        )}
        <Button
          style={{ marginTop: 14 }}
          disabled={isPast}
          onClick={() => setForm({ date: selectedDate, editTime: null })}
        >
          <Icon name="plus" />
          Adicionar horários
        </Button>
        {isPast && (
          <p className="tiny faint center" style={{ marginTop: 8 }}>
            Datas passadas não podem ser alteradas.
          </p>
        )}
      </div>

      <SlotFormOverlay
        open={form !== null}
        date={form?.date ?? selectedDate}
        editTime={form?.editTime ?? null}
        existingSlots={pro.availability[form?.date ?? selectedDate] ?? []}
        activeServices={active}
        onClose={() => setForm(null)}
        onSave={handleSave}
        submitting={submitting}
      />
    </div>
  );
}
