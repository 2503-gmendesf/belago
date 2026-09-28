import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { AdminStatusTag } from './AdminStatusTag.js';
import type { AdminProfAction, AdminProfessional } from '../types.js';

interface ProfessionalDetailOverlayProps {
  professional: AdminProfessional | null;
  onClose: () => void;
  onAction: (id: string, action: AdminProfAction) => void;
  submitting: boolean;
}

const DESTRUCTIVE: Partial<Record<AdminProfAction, { title: string; description: (name: string) => string; confirmLabel: string }>> = {
  suspender: {
    title: 'Suspender profissional?',
    description: (name) => `${name} deixará de aparecer para clientes.`,
    confirmLabel: 'Suspender',
  },
  excluir: {
    title: 'Excluir profissional?',
    description: (name) => `${name} será removida da plataforma.`,
    confirmLabel: 'Excluir',
  },
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfessionalDetailOverlay({ professional: p, onClose, onAction, submitting }: ProfessionalDetailOverlayProps) {
  const [pending, setPending] = useState<AdminProfAction | null>(null);

  useEffect(() => {
    if (!p) setPending(null);
  }, [p]);

  if (!p) return <Overlay open={false} onClose={onClose}>{null}</Overlay>;

  const confirm = pending ? DESTRUCTIVE[pending] : undefined;

  if (confirm) {
    return (
      <Overlay open onClose={() => setPending(null)}>
        <div className="center">
          <div className="confirm-ic">
            <Icon name="alert" />
          </div>
          <h2 className="h2">{confirm.title}</h2>
          <p className="muted small" style={{ margin: '8px 0 20px' }}>
            {confirm.description(p.name)}
          </p>
        </div>
        <div className="stack gap8">
          <Button variant="danger" disabled={submitting} onClick={() => onAction(p.id, pending!)}>
            {confirm.confirmLabel}
          </Button>
          <Button variant="sec" onClick={() => setPending(null)}>
            Cancelar
          </Button>
        </div>
      </Overlay>
    );
  }

  const actionsByStatus: Record<AdminProfessional['status'], Array<[AdminProfAction, string, 'primary' | 'sec' | 'danger']>> = {
    pendente: [
      ['aprovar', 'Aprovar cadastro', 'primary'],
      ['solicitar', 'Pedir documentos', 'sec'],
    ],
    ativa: [
      ['advertir', 'Advertir', 'sec'],
      ['suspender', 'Suspender', 'danger'],
    ],
    suspensa: [
      ['reativar', 'Reativar', 'primary'],
      ['excluir', 'Excluir da plataforma', 'danger'],
    ],
    excluida: [],
  };

  return (
    <Overlay open onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Profissional</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <div className="rowf gap12" style={{ marginBottom: 8 }}>
        <div className="avatar">{initials(p.name)}</div>
        <div className="pro-body">
          <h2 className="h2">{p.name}</h2>
          <p className="small muted">
            {p.spec} · {p.city}
          </p>
        </div>
        <AdminStatusTag status={p.status} />
      </div>
      <div className="kv">
        <span>Agendamentos</span>
        <span className="num">{p.appointmentsCount}</span>
      </div>
      <div className="kv">
        <span>Avaliação</span>
        <span className="num">{p.rating ? p.rating.toFixed(1) : '—'}</span>
      </div>
      <div className="stack gap8" style={{ marginTop: 18 }}>
        {actionsByStatus[p.status].map(([action, label, variant]) => (
          <Button
            key={action}
            variant={variant}
            disabled={submitting}
            onClick={() => (DESTRUCTIVE[action] ? setPending(action) : onAction(p.id, action))}
          >
            {label}
          </Button>
        ))}
      </div>
    </Overlay>
  );
}
