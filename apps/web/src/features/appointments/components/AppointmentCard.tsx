import { Icon } from '../../../components/Icon.js';
import { brl, fmtDay } from '../../../lib/format.js';
import { phaseOf, totalOf } from '../utils.js';
import { StatusTag } from './StatusTag.js';
import type { AppointmentView } from '../types.js';

interface AppointmentCardProps {
  appointment: AppointmentView;
  onCancel: () => void;
  onRate: () => void;
  onDetails: () => void;
}

export function AppointmentCard({ appointment: a, onCancel, onRate, onDetails }: AppointmentCardProps) {
  const phase = phaseOf(a);

  return (
    <div className="card appt-card">
      <div className="rowf between gap8">
        <div className="pro-body">
          <p className="h3 ell">{a.serviceName}</p>
          <p className="small muted ell">{a.professionalName}</p>
        </div>
        <StatusTag phase={phase} />
      </div>
      <div className="rowf gap16 small" style={{ margin: '12px 0' }}>
        <span className="rowf gap8">
          <Icon name="calendar" /> {fmtDay(a.scheduledDate)}
        </span>
        <span className="rowf gap8">
          <Icon name="clock" /> {a.scheduledTime}
        </span>
        <span className="num" style={{ marginLeft: 'auto', fontWeight: 700 }}>
          {brl(totalOf(a))}
        </span>
      </div>
      <div className="rowf gap8">
        {phase === 'confirmado' && (
          <button className="btn btn-sec btn-sm" onClick={onCancel}>
            Cancelar
          </button>
        )}
        {phase === 'realizado' && !a.rated && (
          <button className="btn btn-sec btn-sm" onClick={onRate}>
            <Icon name="star" />
            Avaliar
          </button>
        )}
        <button className="btn btn-sm" onClick={onDetails}>
          Ver detalhes
        </button>
      </div>
    </div>
  );
}
