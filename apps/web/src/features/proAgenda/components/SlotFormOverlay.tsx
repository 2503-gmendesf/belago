import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Icon } from '../../../components/Icon.js';
import { Button } from '../../../components/Button.js';
import { useToast } from '../../../components/ToastProvider.js';
import { fmtDayLong } from '../../../lib/format.js';
import { STD_TIMES } from '../utils.js';
import type { ProAvailabilitySlot, ProService } from '../../discovery/types.js';

interface SlotFormOverlayProps {
  open: boolean;
  date: string;
  editTime: string | null;
  existingSlots: ProAvailabilitySlot[];
  activeServices: ProService[];
  onClose: () => void;
  onSave: (times: string[], all: boolean, serviceIds: string[]) => void;
  submitting: boolean;
}

export function SlotFormOverlay({
  open,
  date,
  editTime,
  existingSlots,
  activeServices,
  onClose,
  onSave,
  submitting,
}: SlotFormOverlayProps) {
  const { toast } = useToast();
  const [times, setTimes] = useState<Set<string>>(new Set());
  const [customTime, setCustomTime] = useState('');
  const [all, setAll] = useState(true);
  const [serviceIds, setServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const editing = editTime ? existingSlots.find((s) => s.time === editTime) : null;
    setTimes(new Set(editTime ? [editTime] : []));
    setCustomTime('');
    setAll(editing ? editing.all : true);
    setServiceIds(new Set(editing ? editing.serviceIds : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTime, date]);

  const existingTimes = new Set(existingSlots.map((s) => s.time));
  const customTimes = [...times].filter((t) => !STD_TIMES.includes(t)).sort();

  function toggleTime(t: string) {
    setTimes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function addCustomTime() {
    if (!/^\d{2}:\d{2}$/.test(customTime)) {
      toast('Informe um horário válido');
      return;
    }
    if (existingTimes.has(customTime)) {
      toast('Esse horário já está ativo');
      return;
    }
    setTimes((prev) => new Set(prev).add(customTime));
    setCustomTime('');
  }

  function toggleService(id: string) {
    setAll(false);
    setServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (!times.size) {
      toast('Selecione ao menos um horário');
      return;
    }
    if (!all && !serviceIds.size) {
      toast('Selecione ao menos um serviço');
      return;
    }
    onSave([...times], all, [...serviceIds]);
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">{editTime ? 'Editar horário' : 'Adicionar horários'}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <p className="small muted" style={{ margin: '-4px 0 16px' }}>
        {fmtDayLong(date)}
      </p>

      {editTime ? (
        <p className="h3" style={{ marginBottom: 16 }}>
          Horário {editTime}
        </p>
      ) : (
        <>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Horários
          </p>
          <div className="slot-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {STD_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`slot${times.has(t) ? ' slot-active' : ''}${existingTimes.has(t) ? ' slot-existing' : ''}`}
                onClick={() => (existingTimes.has(t) ? undefined : toggleTime(t))}
                disabled={existingTimes.has(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="tiny faint" style={{ margin: '8px 0 0' }}>
            Horários tracejados já estão ativos nesta data.
          </p>
          <p className="eyebrow" style={{ margin: '18px 0 8px' }}>
            Horário específico
          </p>
          <div className="rowf gap8">
            <input
              className="input"
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
            <Button variant="sec" style={{ height: 48, width: 'auto' }} onClick={addCustomTime}>
              Adicionar
            </Button>
          </div>
          {customTimes.length > 0 && (
            <div className="chips chips-wrap" style={{ marginTop: 10 }}>
              {customTimes.map((t) => (
                <button key={t} type="button" className="chip chip-active" onClick={() => toggleTime(t)}>
                  {t}
                  <Icon name="x" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Serviços neste horário
      </p>
      <div className="chips chips-wrap">
        <button
          type="button"
          className={`chip${all ? ' chip-active' : ''}`}
          onClick={() => {
            setAll(true);
            setServiceIds(new Set());
          }}
        >
          Todos os serviços ativos
        </button>
        {activeServices.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip${!all && serviceIds.has(s.id) ? ' chip-active' : ''}`}
            style={all ? { opacity: 0.4 } : undefined}
            onClick={() => toggleService(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {activeServices.length === 0 && (
        <p className="small muted" style={{ marginTop: 10 }}>
          Você não tem serviços ativos. Ative ou crie um serviço primeiro.
        </p>
      )}

      <Button style={{ marginTop: 24 }} disabled={submitting} onClick={handleSave}>
        Salvar
      </Button>
    </Overlay>
  );
}
