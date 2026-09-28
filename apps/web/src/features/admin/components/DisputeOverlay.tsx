import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { brl } from '../../../lib/format.js';
import type { AdminDispute, DisputeResolution } from '../types.js';

interface DisputeOverlayProps {
  dispute: AdminDispute | null;
  onClose: () => void;
  onResolve: (id: number, resolution: DisputeResolution) => void;
  submitting: boolean;
}

export function DisputeOverlay({ dispute: d, onClose, onResolve, submitting }: DisputeOverlayProps) {
  if (!d) return <Overlay open={false} onClose={onClose}>{null}</Overlay>;

  return (
    <Overlay open onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Disputa #{4520 + d.id}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <div className="kv">
        <span>Cliente</span>
        <span>{d.clientName}</span>
      </div>
      <div className="kv">
        <span>Profissional</span>
        <span>{d.professionalName}</span>
      </div>
      <div className="kv">
        <span>Valor</span>
        <span className="num">{brl(d.value)}</span>
      </div>
      <div className="kv">
        <span>Motivo</span>
        <span>{d.reason}</span>
      </div>
      <div className="kv">
        <span>Data</span>
        <span>{d.date}</span>
      </div>
      <div className="stack gap8" style={{ marginTop: 18 }}>
        <Button disabled={submitting} onClick={() => onResolve(d.id, 'reembolso')}>
          Reembolsar cliente
        </Button>
        <Button variant="sec" disabled={submitting} onClick={() => onResolve(d.id, 'manter')}>
          Manter pagamento à profissional
        </Button>
      </div>
    </Overlay>
  );
}
