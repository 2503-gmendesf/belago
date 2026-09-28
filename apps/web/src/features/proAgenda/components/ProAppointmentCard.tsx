import { Icon } from '../../../components/Icon.js';
import { brl, fmtDay } from '../../../lib/format.js';
import { phaseOf, totalOf } from '../../appointments/utils.js';
import { StatusTag } from '../../appointments/components/StatusTag.js';
import { whatsappUrl } from '../utils.js';
import type { ProAppointmentView } from '../../appointments/types.js';

interface ProAppointmentCardProps {
  appointment: ProAppointmentView;
  showReview?: boolean;
}

export function ProAppointmentCard({ appointment: a, showReview = false }: ProAppointmentCardProps) {
  const phase = phaseOf(a);
  const firstName = a.clientName.split(' ')[0];

  return (
    <div className="card appt-card">
      <div className="rowf gap12">
        <div className="avatar">{a.clientName.slice(0, 1)}</div>
        <div className="pro-body">
          <p className="h3 ell">{a.clientName}</p>
          <p className="small muted ell">{a.serviceName}</p>
        </div>
        <StatusTag phase={phase} />
      </div>
      <div className="rowf gap16 small" style={{ margin: '12px 0 0', flexWrap: 'wrap' }}>
        <span className="rowf gap8">
          <Icon name="calendar" /> {fmtDay(a.scheduledDate)}
        </span>
        <span className="rowf gap8">
          <Icon name="clock" /> {a.scheduledTime}
        </span>
        {a.location === 'domicilio' && (
          <span className="rowf gap8">
            <Icon name="pin" /> Domicílio
          </span>
        )}
        <span className="num" style={{ marginLeft: 'auto', fontWeight: 700 }}>
          {brl(totalOf(a))}
        </span>
      </div>
      {showReview && a.rated && a.review && (
        <>
          <div className="divider" style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }} />
          <div className="rowf gap8 small">
            <span className="pro-rating">
              <Icon name="star" />
              {a.review.rating}
            </span>
            <span className="muted ell">{a.review.text || 'Sem comentário'}</span>
          </div>
        </>
      )}
      <a
        className="btn btn-sec btn-sm"
        style={{ marginTop: 12, width: '100%', textDecoration: 'none' }}
        href={whatsappUrl(
          a.clientPhone,
          `Olá, ${firstName}! Sobre seu agendamento de ${a.serviceName} em ${fmtDay(a.scheduledDate)} às ${a.scheduledTime}.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="chat" />
        WhatsApp
      </a>
    </div>
  );
}
