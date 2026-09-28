import { Overlay } from '../../../components/Overlay.js';
import { Icon } from '../../../components/Icon.js';
import { Button } from '../../../components/Button.js';
import { brl, fmtDayLong, fromMinutes, toMinutes } from '../../../lib/format.js';
import { phaseOf, totalOf } from '../utils.js';
import { StatusTag } from './StatusTag.js';
import type { AppointmentView } from '../types.js';

interface DetailOverlayProps {
  appointment: AppointmentView | null;
  onClose: () => void;
  onCancel: () => void;
  onRate: () => void;
}

export function DetailOverlay({ appointment: a, onClose, onCancel, onRate }: DetailOverlayProps) {
  function whatsapp() {
    if (!a) return;
    window.open(
      'https://wa.me/?text=' +
        encodeURIComponent(`Olá! Sobre meu agendamento de ${a.serviceName} em ${fmtDayLong(a.scheduledDate)} às ${a.scheduledTime}.`),
      '_blank',
      'noopener',
    );
  }

  function maps() {
    if (!a) return;
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a.address), '_blank', 'noopener');
  }

  if (!a) return <Overlay open={false} onClose={onClose}>{null}</Overlay>;

  const phase = phaseOf(a);
  const end = fromMinutes(toMinutes(a.scheduledTime) + a.durationMin);
  const isHome = a.location === 'domicilio';

  return (
    <Overlay open={a !== null} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Detalhes</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>

      <div className="rowf gap12" style={{ marginBottom: 8 }}>
        <div className="avatar">{a.professionalName.slice(0, 1)}</div>
        <div className="pro-body">
          <p className="h3">{a.professionalName}</p>
          <p className="small muted">{a.serviceName}</p>
        </div>
        <StatusTag phase={phase} />
      </div>

      <div className="kv">
        <span>Serviço</span>
        <span>{a.serviceName}</span>
      </div>
      <div className="kv">
        <span>Data</span>
        <span>{fmtDayLong(a.scheduledDate)}</span>
      </div>
      <div className="kv">
        <span>Início</span>
        <span>{a.scheduledTime}</span>
      </div>
      <div className="kv">
        <span>Término</span>
        <span>{end}</span>
      </div>
      <div className="kv">
        <span>Valor</span>
        <span className="num">{brl(totalOf(a))}</span>
      </div>
      {a.homeFee > 0 && (
        <div className="kv">
          <span>Inclui deslocamento</span>
          <span className="num">{brl(a.homeFee)}</span>
        </div>
      )}
      <div className="kv">
        <span>Status</span>
        <span>{phase === 'confirmado' ? 'Confirmado' : phase === 'realizado' ? 'Realizado' : 'Cancelado'}</span>
      </div>
      {a.address && (
        <div className="kv">
          <span>{isHome ? 'Atendimento em domicílio' : 'Endereço'}</span>
          <span style={{ maxWidth: '60%' }}>{a.address}</span>
        </div>
      )}
      {a.rated && a.review && (
        <div className="kv">
          <span>Sua avaliação</span>
          <span>
            {a.review.rating} de 5{a.review.text ? ` — ${a.review.text}` : ''}
          </span>
        </div>
      )}

      <div className="stack gap8" style={{ marginTop: 18, marginBottom: 8 }}>
        {!isHome && (
          <Button variant="sec" onClick={maps}>
            <Icon name="calendar" />
            Ver endereço
          </Button>
        )}
        <Button variant="sec" onClick={whatsapp}>
          WhatsApp
        </Button>
        {phase === 'confirmado' && (
          <Button
            variant="danger"
            onClick={() => {
              onClose();
              onCancel();
            }}
          >
            Cancelar agendamento
          </Button>
        )}
        {phase === 'realizado' && !a.rated && (
          <Button
            onClick={() => {
              onClose();
              onRate();
            }}
          >
            Avaliar atendimento
          </Button>
        )}
      </div>
    </Overlay>
  );
}
