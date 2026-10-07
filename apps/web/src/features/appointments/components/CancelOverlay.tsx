import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { CFG } from '@belago/shared';
import { useRates } from '../../../context/ratesContext.js';
import { brl, pctLabel } from '../../../lib/format.js';
import { cancelFeeOf, isLateToCancel } from '../utils.js';
import type { AppointmentView } from '../types.js';

interface CancelOverlayProps {
  appointment: AppointmentView | null;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function CancelOverlay({ appointment: a, onClose, onConfirm, submitting }: CancelOverlayProps) {
  const { lateCancelPenaltyRate } = useRates();
  return (
    <Overlay open={a !== null} onClose={onClose}>
      {a && (
        <div>
          <div className="center">
            <div className="confirm-ic">
              <Icon name="x" />
            </div>
            <h2 className="h2">Cancelar agendamento?</h2>
            <p className="muted small" style={{ margin: '8px 0 20px' }}>
              {isLateToCancel(a)
                ? `Faltam menos de ${CFG.lateCancelHours}h para o horário. Pode haver cobrança de ${pctLabel(lateCancelPenaltyRate)}% (${brl(cancelFeeOf(a, lateCancelPenaltyRate))}).`
                : `Você pode cancelar sem custo até ${CFG.lateCancelHours}h antes do horário.`}
            </p>
          </div>
          <div className="stack gap8">
            <Button variant="danger" disabled={submitting} onClick={onConfirm}>
              Cancelar agendamento
            </Button>
            <Button variant="sec" onClick={onClose}>
              Manter agendamento
            </Button>
          </div>
        </div>
      )}
    </Overlay>
  );
}
